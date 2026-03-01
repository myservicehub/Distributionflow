import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendStaffInvitation } from '@/lib/email'
import { can } from '@/lib/permissions'

// Initialize Supabase client (server-side with service role for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to create authenticated Supabase client from request
async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore
        }
      },
    },
  })
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Get current user's business ID  
async function getUserBusinessId(supabase) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user?.id, 'Error:', authError)
    
    if (!user) {
      console.log('No user found in auth')
      return null
    }

    // Get business directly using owner_id to avoid users table RLS
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    console.log('Business query result:', business, 'Error:', businessError)

    if (!business) {
      console.log('No business found for user')
      return null
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    console.log('User profile:', userProfile, 'Error:', profileError)

    return { 
      businessId: business.id, 
      role: userProfile?.role || 'admin', 
      userId: userProfile?.id 
    }
  } catch (error) {
    console.error('Error in getUserBusinessId:', error)
    return null
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const supabase = await getSupabaseClient()

    // ============================================
    // DASHBOARD ENDPOINTS
    // ============================================
    
    if (route === '/dashboard/metrics' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Get total sales today
      const { data: salesToday } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', userContext.businessId)
        .gte('created_at', today.toISOString())
        .eq('status', 'confirmed')

      const totalSalesToday = salesToday?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

      // Get total sales this month
      const { data: salesMonth } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', userContext.businessId)
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'confirmed')

      const totalSalesMonth = salesMonth?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

      // Get total outstanding debt
      const { data: retailers } = await supabase
        .from('retailers')
        .select('current_balance')
        .eq('business_id', userContext.businessId)

      const totalDebt = retailers?.reduce((sum, retailer) => sum + parseFloat(retailer.current_balance), 0) || 0

      // Get overdue retailers (balance > credit limit)
      const { data: overdueRetailers } = await supabase
        .from('retailers')
        .select('id, shop_name, current_balance, credit_limit')
        .eq('business_id', userContext.businessId)
        .eq('status', 'blocked')

      // Get low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold')
        .eq('business_id', userContext.businessId)
        .filter('stock_quantity', 'lte', 'low_stock_threshold')

      // Get sales by rep
      const { data: salesByRep } = await supabase
        .from('orders')
        .select('sales_rep_id, total_amount, users(name)')
        .eq('business_id', userContext.businessId)
        .eq('status', 'confirmed')

      const repSales = {}
      salesByRep?.forEach(order => {
        const repName = order.users?.name || 'Unknown'
        if (!repSales[repName]) {
          repSales[repName] = 0
        }
        repSales[repName] += parseFloat(order.total_amount)
      })

      return handleCORS(NextResponse.json({
        totalSalesToday,
        totalSalesMonth,
        totalDebt,
        overdueRetailers: overdueRetailers || [],
        lowStockProducts: lowStockProducts || [],
        salesByRep: Object.entries(repSales).map(([name, total]) => ({ name, total }))
      }))
    }

    // ============================================
    // RETAILERS ENDPOINTS
    // ============================================

    if (route === '/retailers' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('retailers')
        .select('*, users(name)')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/retailers' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { data, error } = await supabase
        .from('retailers')
        .insert({
          business_id: userContext.businessId,
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
          address: body.address,
          assigned_rep_id: body.assigned_rep_id,
          credit_limit: body.credit_limit || 0,
          current_balance: 0,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/retailers/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const retailerId = route.split('/')[2]
      const body = await request.json()
      
      const { data, error } = await supabase
        .from('retailers')
        .update({
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
          address: body.address,
          assigned_rep_id: body.assigned_rep_id,
          credit_limit: body.credit_limit,
          status: body.status
        })
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/retailers/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const retailerId = route.split('/')[2]
      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============================================
    // PRODUCTS ENDPOINTS
    // ============================================

    if (route === '/products' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('name')

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/products' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { data, error } = await supabase
        .from('products')
        .insert({
          business_id: userContext.businessId,
          name: body.name,
          sku: body.sku,
          cost_price: body.cost_price || 0,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity || 0,
          low_stock_threshold: body.low_stock_threshold || 10
        })
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/products/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const productId = route.split('/')[2]
      const body = await request.json()
      
      const { data, error } = await supabase
        .from('products')
        .update({
          name: body.name,
          sku: body.sku,
          cost_price: body.cost_price,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity,
          low_stock_threshold: body.low_stock_threshold
        })
        .eq('id', productId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/products/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const productId = route.split('/')[2]
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============================================
    // ORDERS ENDPOINTS
    // ============================================

    if (route === '/orders' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, retailers(shop_name), users(name)')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/orders' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      
      // Check retailer credit limit if payment is credit
      if (body.payment_status === 'credit' || body.payment_status === 'partial') {
        const { data: retailer } = await supabase
          .from('retailers')
          .select('current_balance, credit_limit, status')
          .eq('id', body.retailer_id)
          .single()

        if (retailer && retailer.status === 'blocked') {
          return handleCORS(NextResponse.json({ 
            error: 'Retailer is blocked due to credit limit exceeded' 
          }, { status: 400 }))
        }

        const newBalance = parseFloat(retailer.current_balance) + parseFloat(body.total_amount)
        if (newBalance > parseFloat(retailer.credit_limit)) {
          return handleCORS(NextResponse.json({ 
            error: 'Order would exceed retailer credit limit' 
          }, { status: 400 }))
        }
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          business_id: userContext.businessId,
          retailer_id: body.retailer_id,
          sales_rep_id: userContext.userId,
          total_amount: body.total_amount,
          payment_status: body.payment_status,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items and update stock
      for (const item of body.items) {
        // Insert order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          })

        if (itemError) throw itemError

        // Deduct stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        const newStock = product.stock_quantity - item.quantity
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${item.product_id}`)
        }

        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id)

        // Record stock movement
        await supabase
          .from('stock_movements')
          .insert({
            business_id: userContext.businessId,
            product_id: item.product_id,
            type: 'OUT',
            quantity: item.quantity,
            reference: `Order ${order.id}`,
            created_by: userContext.userId
          })
      }

      // Update retailer balance if credit
      if (body.payment_status === 'credit') {
        const { data: retailer } = await supabase
          .from('retailers')
          .select('current_balance')
          .eq('id', body.retailer_id)
          .single()

        const newBalance = parseFloat(retailer.current_balance) + parseFloat(body.total_amount)
        
        await supabase
          .from('retailers')
          .update({ current_balance: newBalance })
          .eq('id', body.retailer_id)
      }

      // Update order status to confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id)

      return handleCORS(NextResponse.json(order))
    }

    if (route.startsWith('/orders/') && route.endsWith('/items') && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const orderId = route.split('/')[2]
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, sku)')
        .eq('order_id', orderId)

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    // ============================================
    // PAYMENTS ENDPOINTS
    // ============================================

    if (route === '/payments' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*, retailers(shop_name), users(name)')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/payments' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          business_id: userContext.businessId,
          retailer_id: body.retailer_id,
          order_id: body.order_id || null,
          amount_paid: body.amount_paid,
          payment_method: body.payment_method,
          notes: body.notes,
          recorded_by: userContext.userId
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update retailer balance
      const { data: retailer } = await supabase
        .from('retailers')
        .select('current_balance, credit_limit')
        .eq('id', body.retailer_id)
        .single()

      const newBalance = parseFloat(retailer.current_balance) - parseFloat(body.amount_paid)
      const finalBalance = Math.max(0, newBalance) // Don't allow negative balance

      // Update status based on new balance
      const newStatus = finalBalance <= parseFloat(retailer.credit_limit) ? 'active' : 'blocked'

      await supabase
        .from('retailers')
        .update({ 
          current_balance: finalBalance,
          status: newStatus
        })
        .eq('id', body.retailer_id)

      return handleCORS(NextResponse.json(payment))
    }

    // ============================================
    // STAFF/USERS ENDPOINTS
    // ============================================

    if (route === '/staff' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      // Use service role client to bypass RLS and fetch all staff
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/staff' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const body = await request.json()
      
      // Generate temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!${Math.floor(Math.random() * 100)}`
      
      // Create service role client for admin operations
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: body.name,
          needs_password_change: true
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        throw new Error(`Failed to create user account: ${authError.message}`)
      }

      // Create user profile in users table using admin client to bypass RLS
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          business_id: userContext.businessId,
          email: body.email,
          name: body.name,
          role: body.role,
          status: 'active'
        })
        .select()
        .single()

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw profileError
      }

      return handleCORS(NextResponse.json({
        user: userProfile,
        tempPassword: tempPassword
      }))
    }

    if (route.startsWith('/staff/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const staffId = route.split('/')[2]
      const body = await request.json()
      
      // Use service role client to bypass RLS
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          name: body.name,
          role: body.role,
          status: body.status
        })
        .eq('id', staffId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/staff/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const staffId = route.split('/')[2]
      
      // Use service role client to bypass RLS
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Soft delete - just mark as inactive
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', staffId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // REPORTS ENDPOINTS
    // ============================================

    if (route === '/reports/debt-aging' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('retailers')
        .select('shop_name, current_balance, credit_limit, created_at')
        .eq('business_id', userContext.businessId)
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false })

      if (error) throw error

      // Calculate aging (simplified - based on account creation date)
      const now = new Date()
      const aging = data?.map(retailer => {
        const daysSinceCreation = Math.floor((now - new Date(retailer.created_at)) / (1000 * 60 * 60 * 24))
        let category = '0-30 days'
        if (daysSinceCreation > 90) category = '90+ days'
        else if (daysSinceCreation > 60) category = '60-90 days'
        else if (daysSinceCreation > 30) category = '30-60 days'

        return {
          ...retailer,
          aging_category: category,
          days_outstanding: daysSinceCreation
        }
      })

      return handleCORS(NextResponse.json(aging || []))
    }

    if (route === '/reports/sales-by-rep' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('orders')
        .select('sales_rep_id, total_amount, status, users(name)')
        .eq('business_id', userContext.businessId)
        .eq('status', 'confirmed')

      if (error) throw error

      // Group by rep
      const repSales = {}
      data?.forEach(order => {
        const repName = order.users?.name || 'Unknown'
        if (!repSales[repName]) {
          repSales[repName] = { name: repName, total: 0, orders: 0 }
        }
        repSales[repName].total += parseFloat(order.total_amount)
        repSales[repName].orders += 1
      })

      return handleCORS(NextResponse.json(Object.values(repSales)))
    }

    if (route === '/reports/inventory' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('stock_quantity')

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
