import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Get current user's business ID
async function getUserBusinessId(supabase) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userProfile } = await supabase
      .from('users')
      .select('id, role, business_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) return null

    return {
      userId: userProfile.id,
      businessId: userProfile.business_id,
      role: userProfile.role,
      status: userProfile.status
    }
  } catch (error) {
    console.error('Error getting user business ID:', error)
    return null
  }
}

/**
 * GET /api/reports/sales-by-rep
 * Sales by rep report with product details
 */
export async function GET(request) {
  const supabase = await createClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get date range from query parameter
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30d'

    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    if (range === '7d') startDate.setDate(startDate.getDate() - 7)
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30)
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90)
    else if (range === 'today') { /* already today */ }
    else startDate.setFullYear(2000) // 'all' — no date filter

    // Fetch orders with order items and products
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, sales_rep_id, total_amount, status, order_status, created_at, order_items(quantity, unit_price, total_price, product_id, products(name, sku))')
      .eq('business_id', userContext.businessId)
      .gte('created_at', startDate.toISOString())
      .or('order_status.in.(confirmed,completed),status.in.(confirmed,delivered)')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Use admin client to fetch sales rep names
    const supabaseAdmin = createSupabaseClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get unique sales rep IDs
    const repIds = [...new Set(orders?.map(o => o.sales_rep_id).filter(Boolean))]
    
    // Fetch all sales reps data
    const { data: salesReps } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', repIds)

    // Create a map of rep ID to rep data
    const repMap = {}
    salesReps?.forEach(rep => {
      repMap[rep.id] = rep
    })

    // Group by rep with product details
    const repSales = {}
    orders?.forEach(order => {
      const repId = order.sales_rep_id
      const repData = repMap[repId]
      const repName = repData?.name || 'Unassigned'
      const orderDate = order.created_at
      
      if (!repSales[repName]) {
        repSales[repName] = { 
          name: repName, 
          email: repData?.email || '',
          total: 0, 
          orders: 0,
          items: 0,
          products: {},
          sales: []
        }
      }
      
      repSales[repName].total += parseFloat(order.total_amount)
      repSales[repName].orders += 1
      
      // Track individual products
      order.order_items?.forEach(item => {
        repSales[repName].items += item.quantity
        
        const productName = item.products?.name || item.product_id
        const productSku = item.products?.sku || ''
        const productKey = `${productName}_${productSku}`
        
        if (!repSales[repName].products[productKey]) {
          repSales[repName].products[productKey] = {
            name: productName,
            sku: productSku,
            quantity: 0,
            totalValue: 0,
            unitPrice: item.unit_price,
            sales: []
          }
        }
        
        repSales[repName].products[productKey].quantity += item.quantity
        repSales[repName].products[productKey].totalValue += parseFloat(item.total_price)
        
        repSales[repName].products[productKey].sales.push({
          date: orderDate,
          quantity: item.quantity,
          value: item.total_price,
          orderId: order.id
        })
      })
    })

    // Convert products object to array
    const result = Object.values(repSales).map(rep => ({
      ...rep,
      products: Object.values(rep.products).map(product => ({
        ...product,
        sales: product.sales.sort((a, b) => new Date(b.date) - new Date(a.date))
      }))
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching sales by rep report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
