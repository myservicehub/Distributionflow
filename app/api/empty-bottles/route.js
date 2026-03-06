// Empty Bottle Lifecycle Management API Routes
// Handles manufacturer supply, empty issuance, returns, and reconciliation

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendNotification } from '@/lib/notifications'
import { hasFeature, FEATURES } from '@/lib/subscription'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Helper function for CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Note: This helper is not used. Auth is handled inline in GET and POST handlers.

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

export async function GET(request) {
  const supabase = await getSupabaseClient()
  const { searchParams } = new URL(request.url)
  const route = searchParams.get('route')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile using auth_user_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, business_id, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) {
      return handleCORS(NextResponse.json({ error: 'User profile not found' }, { status: 401 }))
    }

    // CHECK FEATURE ACCESS: Empty Lifecycle Management
    // TEMPORARILY DISABLED FOR TESTING - All users can access
    // const hasEmptyLifecycle = await hasFeature(userProfile.business_id, FEATURES.EMPTY_LIFECYCLE)
    // if (!hasEmptyLifecycle) {
    //   return handleCORS(NextResponse.json({
    //     error: 'Feature not available',
    //     message: 'Empty Bottle Lifecycle Management is not available on your current plan. Please upgrade to the Business or Enterprise plan.',
    //     code: 'FEATURE_NOT_AVAILABLE',
    //     requiredFeature: 'empty_lifecycle'
    //   }, { status: 403 }))
    // }

    // Use service client for queries (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js')
    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // ============================================
    // GET: Empty Items List
    // ============================================
    if (route === 'empty-items') {
      const { data, error } = await adminSupabase
        .from('empty_items')
        .select('*')
        .eq('business_id', userProfile.business_id)
        .order('name', { ascending: true })

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // GET: Warehouse Empty Inventory
    // ============================================
    if (route === 'warehouse-empty-inventory') {
      const { data, error } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select(`
          *,
          empty_items(name, deposit_value)
        `)
        .eq('business_id', userProfile.business_id)

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // GET: Retailer Empty Balances
    // ============================================
    if (route === 'retailer-empty-balances') {
      const retailerId = searchParams.get('retailer_id')
      
      let query = supabase
        .from('retailer_empty_balances')
        .select(`
          *,
          empty_items(name, deposit_value),
          retailers(shop_name)
        `)
        .eq('business_id', userProfile.business_id)

      if (retailerId) {
        query = query.eq('retailer_id', retailerId)
      }

      const { data, error } = await query

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // GET: Empty Movements (History)
    // ============================================
    if (route === 'empty-movements') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const emptyItemId = searchParams.get('empty_item_id')
      const retailerId = searchParams.get('retailer_id')

      let query = adminSupabase
        .from('empty_movements')
        .select(`
          *,
          empty_items(name),
          retailers(shop_name),
          users(name)
        `)
        .eq('business_id', userProfile.business_id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (emptyItemId) query = query.eq('empty_item_id', emptyItemId)
      if (retailerId) query = query.eq('retailer_id', retailerId)

      const { data, error } = await query

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // GET: Empty Dashboard Metrics
    // ============================================
    if (route === 'empty-dashboard-metrics') {
      // Warehouse empty stock
      const { data: warehouseStock } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available, empty_items(deposit_value)')
        .eq('business_id', userProfile.business_id)

      const totalWarehouseQty = warehouseStock?.reduce((sum, item) => sum + item.quantity_available, 0) || 0
      const totalWarehouseValue = warehouseStock?.reduce((sum, item) => 
        sum + (item.quantity_available * (item.empty_items?.deposit_value || 0)), 0) || 0

      // Retailer outstanding balances
      const { data: retailerBalances } = await adminSupabase
        .from('retailer_empty_balances')
        .select('quantity_outstanding, empty_items(deposit_value), retailers(shop_name)')
        .eq('business_id', userProfile.business_id)

      const totalRetailerQty = retailerBalances?.reduce((sum, item) => sum + item.quantity_outstanding, 0) || 0
      const totalRetailerValue = retailerBalances?.reduce((sum, item) => 
        sum + (item.quantity_outstanding * (item.empty_items?.deposit_value || 0)), 0) || 0

      // Top retailers holding empties
      const retailerGroups = {}
      retailerBalances?.forEach(item => {
        const shopName = item.retailers?.shop_name || 'Unknown'
        if (!retailerGroups[shopName]) {
          retailerGroups[shopName] = { shop_name: shopName, quantity: 0, value: 0 }
        }
        retailerGroups[shopName].quantity += item.quantity_outstanding
        retailerGroups[shopName].value += item.quantity_outstanding * (item.empty_items?.deposit_value || 0)
      })
      const topRetailers = Object.values(retailerGroups)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      // Today's movements
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayReturns } = await adminSupabase
        .from('empty_movements')
        .select('quantity')
        .eq('business_id', userProfile.business_id)
        .eq('type', 'returned_from_retailer')
        .gte('created_at', today.toISOString())

      const { data: todayIssued } = await adminSupabase
        .from('empty_movements')
        .select('quantity')
        .eq('business_id', userProfile.business_id)
        .eq('type', 'issued_to_retailer')
        .gte('created_at', today.toISOString())

      const returnsToday = todayReturns?.reduce((sum, m) => sum + m.quantity, 0) || 0
      const issuedToday = todayIssued?.reduce((sum, m) => sum + m.quantity, 0) || 0

      return handleCORS(NextResponse.json({
        warehouse: {
          totalQuantity: totalWarehouseQty,
          totalValue: totalWarehouseValue
        },
        retailers: {
          totalQuantity: totalRetailerQty,
          totalValue: totalRetailerValue
        },
        totalDepositExposure: totalWarehouseValue + totalRetailerValue,
        topRetailers,
        today: {
          returned: returnsToday,
          issued: issuedToday
        }
      }))
    }

    // ============================================
    // GET: Empty Reconciliation Report
    // ============================================
    if (route === 'empty-reconciliation') {
      const { data: movements } = await adminSupabase
        .from('empty_movements')
        .select('type, quantity, empty_item_id, empty_items(name)')
        .eq('business_id', userProfile.business_id)

      const { data: warehouseStock } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available, empty_item_id, empty_items(name)')
        .eq('business_id', userProfile.business_id)

      const { data: retailerBalances } = await adminSupabase
        .from('retailer_empty_balances')
        .select('quantity_outstanding, empty_item_id, empty_items(name)')
        .eq('business_id', userProfile.business_id)

      // Calculate per empty item
      const reconciliation = {}

      movements?.forEach(m => {
        const itemName = m.empty_items?.name || 'Unknown'
        if (!reconciliation[itemName]) {
          reconciliation[itemName] = {
            manufacturer_in: 0,
            issued: 0,
            returned: 0,
            returned_to_manufacturer: 0,
            adjusted: 0,
            damaged: 0,
            lost: 0
          }
        }

        switch (m.type) {
          case 'manufacturer_in':
            reconciliation[itemName].manufacturer_in += m.quantity
            break
          case 'issued_to_retailer':
            reconciliation[itemName].issued += m.quantity
            break
          case 'returned_from_retailer':
            reconciliation[itemName].returned += m.quantity
            break
          case 'returned_to_manufacturer':
            reconciliation[itemName].returned_to_manufacturer += m.quantity
            break
          case 'adjustment':
            reconciliation[itemName].adjusted += m.quantity
            break
          case 'damaged':
            reconciliation[itemName].damaged += m.quantity
            break
          case 'lost':
            reconciliation[itemName].lost += m.quantity
            break
        }
      })

      // Add current balances
      warehouseStock?.forEach(w => {
        const itemName = w.empty_items?.name || 'Unknown'
        if (reconciliation[itemName]) {
          reconciliation[itemName].warehouse_current = w.quantity_available
        }
      })

      retailerBalances?.forEach(r => {
        const itemName = r.empty_items?.name || 'Unknown'
        if (reconciliation[itemName]) {
          reconciliation[itemName].retailer_current = (reconciliation[itemName].retailer_current || 0) + r.quantity_outstanding
        }
      })

      // Calculate expected vs actual
      Object.keys(reconciliation).forEach(itemName => {
        const r = reconciliation[itemName]
        r.expected_total = r.manufacturer_in - r.returned_to_manufacturer - r.damaged - r.lost + r.adjusted
        r.actual_total = (r.warehouse_current || 0) + (r.retailer_current || 0)
        r.discrepancy = r.actual_total - r.expected_total
        r.status = Math.abs(r.discrepancy) > 5 ? 'mismatch' : 'ok' // Threshold = 5
      })

      return handleCORS(NextResponse.json(reconciliation))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))

  } catch (error) {
    console.error('Empty bottle API error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function POST(request) {
  const supabase = await getSupabaseClient()
  const body = await request.json()
  const route = body.route

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile using auth_user_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, business_id, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) {
      return handleCORS(NextResponse.json({ error: 'User profile not found' }, { status: 401 }))
    }

    // CHECK FEATURE ACCESS: Empty Lifecycle Management
    // TEMPORARILY DISABLED FOR TESTING - All users can access
    // const hasEmptyLifecycle = await hasFeature(userProfile.business_id, FEATURES.EMPTY_LIFECYCLE)
    // if (!hasEmptyLifecycle) {
    //   return handleCORS(NextResponse.json({
    //     error: 'Feature not available',
    //     message: 'Empty Bottle Lifecycle Management is not available on your current plan. Please upgrade to the Business or Enterprise plan.',
    //     code: 'FEATURE_NOT_AVAILABLE',
    //     requiredFeature: 'empty_lifecycle'
    //   }, { status: 403 }))
    // }

    // Use service client for queries (bypasses RLS)
    const { createClient } = await import('@supabase/supabase-js')
    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // ============================================
    // POST: Create Empty Item
    // ============================================
    if (route === 'create-empty-item') {
      if (!['admin', 'manager'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { name, deposit_value, initial_quantity } = body
      const initialQty = parseInt(initial_quantity) || 0

      const { data, error } = await adminSupabase
        .from('empty_items')
        .insert({
          business_id: userProfile.business_id,
          name: name,
          deposit_value: deposit_value
        })
        .select()
        .single()

      if (error) throw error

      // Initialize warehouse inventory for this item with initial quantity
      const { error: inventoryError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id: data.id,
          quantity_available: initialQty
        })

      if (inventoryError) throw inventoryError

      // If initial quantity > 0, log it as a manufacturer supply movement
      if (initialQty > 0) {
        await adminSupabase
          .from('empty_movements')
          .insert({
            business_id: userProfile.business_id,
            empty_item_id: data.id,
            type: 'manufacturer_in',
            quantity: initialQty,
            reference_type: 'initial_stock',
            notes: 'Initial stock when creating empty item',
            created_by: userProfile.id
          })
      }

      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // POST: Manufacturer Supply (Receive Empties)
    // ============================================
    if (route === 'manufacturer-supply') {
      if (!['admin', 'manager', 'warehouse'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { empty_item_id, quantity, notes } = body

      // Update warehouse inventory
      const { data: currentInventory } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available')
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)
        .single()

      const newQuantity = (currentInventory?.quantity_available || 0) + quantity

      const { error: updateError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .upsert({
          business_id: userProfile.business_id,
          empty_item_id,
          quantity_available: newQuantity
        }, { onConflict: 'business_id,empty_item_id' })

      if (updateError) throw updateError

      // Log movement
      const { data: movement, error: movementError } = await adminSupabase
        .from('empty_movements')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id,
          type: 'manufacturer_in',
          quantity,
          reference_type: 'manufacturer',
          notes,
          created_by: userProfile.id
        })
        .select()
        .single()

      if (movementError) throw movementError

      // Send notification
      const { data: emptyItem } = await adminSupabase
        .from('empty_items')
        .select('name')
        .eq('id', empty_item_id)
        .single()

      await sendNotification({
        title: 'Manufacturer Supply Received',
        message: `Received ${quantity} units of ${emptyItem?.name || 'empty items'} from manufacturer.`,
        type: 'info',
        category: 'inventory',
        targetRoles: ['admin', 'manager'],
        businessId: userProfile.business_id,
        triggeredBy: userProfile.id,
        relatedTable: 'empty_movements',
        relatedRecordId: movement.id
      })

      return handleCORS(NextResponse.json({ success: true, movement }))
    }

    // ============================================
    // POST: Process Empty Return from Retailer
    // ============================================

    // ============================================
    // POST: Issue Empties to Retailer
    // ============================================
    if (route === 'issue-to-retailer') {
      if (!['admin', 'manager', 'warehouse'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { retailer_id, empty_item_id, quantity, notes } = body

      if (!retailer_id || !empty_item_id || !quantity) {
        return handleCORS(NextResponse.json({ 
          error: 'Missing required fields: retailer_id, empty_item_id, quantity' 
        }, { status: 400 }))
      }

      // Check warehouse inventory
      const { data: warehouse, error: warehouseError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available')
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)
        .single()

      if (warehouseError || !warehouse) {
        return handleCORS(NextResponse.json({ 
          error: 'Empty item not found in warehouse inventory' 
        }, { status: 404 }))
      }

      if (warehouse.quantity_available < quantity) {
        return handleCORS(NextResponse.json({ 
          error: `Insufficient warehouse inventory. Available: ${warehouse.quantity_available}, Requested: ${quantity}` 
        }, { status: 400 }))
      }

      // Decrease warehouse inventory
      const { error: updateWarehouseError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .update({ 
          quantity_available: warehouse.quantity_available - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)

      if (updateWarehouseError) {
        console.error('Error updating warehouse inventory:', updateWarehouseError)
        throw updateWarehouseError
      }

      // Increase or create retailer balance
      const { data: existingBalance } = await adminSupabase
        .from('retailer_empty_balances')
        .select('quantity_outstanding')
        .eq('business_id', userProfile.business_id)
        .eq('retailer_id', retailer_id)
        .eq('empty_item_id', empty_item_id)
        .maybeSingle()

      if (existingBalance) {
        // Update existing balance
        const { error: balanceError } = await adminSupabase
          .from('retailer_empty_balances')
          .update({ 
            quantity_outstanding: existingBalance.quantity_outstanding + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('business_id', userProfile.business_id)
          .eq('retailer_id', retailer_id)
          .eq('empty_item_id', empty_item_id)

        if (balanceError) {
          console.error('Error updating retailer balance:', balanceError)
          throw balanceError
        }
      } else {
        // Create new balance record
        const { error: balanceError } = await adminSupabase
          .from('retailer_empty_balances')
          .insert({
            business_id: userProfile.business_id,
            retailer_id,
            empty_item_id,
            quantity_outstanding: quantity
          })

        if (balanceError) {
          console.error('Error creating retailer balance:', balanceError)
          throw balanceError
        }
      }

      // Log movement
      const { data: movement } = await adminSupabase
        .from('empty_movements')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id,
          retailer_id,
          type: 'issued_to_retailer',
          quantity,
          reference_type: 'issue',
          notes: notes || `Issued to retailer`,
          created_by: userProfile.id
        })
        .select()
        .single()

      console.log(`✅ Issued ${quantity} empties to retailer ${retailer_id}`)

      return handleCORS(NextResponse.json({ 
        success: true, 
        movement,
        message: `Successfully issued ${quantity} empties to retailer` 
      }))
    }

    if (route === 'process-empty-return') {
      const { retailer_id, empty_item_id, quantity, order_id, notes } = body

      // Validate retailer balance
      const { data: balance } = await adminSupabase
        .from('retailer_empty_balances')
        .select('quantity_outstanding')
        .eq('business_id', userProfile.business_id)
        .eq('retailer_id', retailer_id)
        .eq('empty_item_id', empty_item_id)
        .single()

      if (!balance || balance.quantity_outstanding < quantity) {
        return handleCORS(NextResponse.json({ 
          error: `Insufficient retailer balance. Available: ${balance?.quantity_outstanding || 0}, Requested: ${quantity}` 
        }, { status: 400 }))
      }

      // Reduce retailer balance
      const { error: balanceError } = await adminSupabase
        .from('retailer_empty_balances')
        .update({ quantity_outstanding: balance.quantity_outstanding - quantity })
        .eq('business_id', userProfile.business_id)
        .eq('retailer_id', retailer_id)
        .eq('empty_item_id', empty_item_id)

      if (balanceError) throw balanceError

      // Increase warehouse inventory
      const { data: warehouse } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available')
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)
        .single()

      const { error: warehouseError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .update({ quantity_available: (warehouse?.quantity_available || 0) + quantity })
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)

      if (warehouseError) throw warehouseError

      // Log movement
      const { data: movement } = await adminSupabase
        .from('empty_movements')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id,
          retailer_id,
          type: 'returned_from_retailer',
          quantity,
          reference_type: order_id ? 'order' : 'return',
          reference_id: order_id || null,
          notes,
          created_by: userProfile.id
        })
        .select()
        .single()

      return handleCORS(NextResponse.json({ success: true, movement }))
    }

    // ============================================
    // POST: Process Bottle Exchange
    // Customer buys products and brings empties
    // ============================================
    if (route === 'process-bottle-exchange') {
      const { retailer_id, products_purchased, empties_brought, deposit_amount, notes } = body

      if (!retailer_id || !products_purchased || products_purchased.length === 0) {
        return handleCORS(NextResponse.json({ 
          error: 'Missing required fields: retailer_id, products_purchased' 
        }, { status: 400 }))
      }

      // Add empties brought by customer to warehouse inventory
      for (const empty of empties_brought || []) {
        const { empty_item_id, quantity } = empty

        // Check if warehouse inventory exists for this empty
        const { data: existing } = await adminSupabase
          .from('warehouse_empty_inventory')
          .select('quantity_available')
          .eq('business_id', userProfile.business_id)
          .eq('empty_item_id', empty_item_id)
          .maybeSingle()

        if (existing) {
          // Update existing inventory
          await adminSupabase
            .from('warehouse_empty_inventory')
            .update({ 
              quantity_available: existing.quantity_available + quantity,
              updated_at: new Date().toISOString()
            })
            .eq('business_id', userProfile.business_id)
            .eq('empty_item_id', empty_item_id)
        } else {
          // Create new inventory record
          await adminSupabase
            .from('warehouse_empty_inventory')
            .insert({
              business_id: userProfile.business_id,
              empty_item_id,
              quantity_available: quantity
            })
        }

        // Log the movement (customer returning empties)
        await adminSupabase
          .from('empty_movements')
          .insert({
            business_id: userProfile.business_id,
            empty_item_id,
            retailer_id,
            type: 'returned_from_retailer',
            quantity,
            reference_type: 'bottle_exchange',
            notes: notes || 'Customer brought empties during purchase',
            created_by: userProfile.id
          })
      }

      // Record deposit if any
      if (deposit_amount && deposit_amount > 0) {
        await adminSupabase
          .from('payments')
          .insert({
            business_id: userProfile.business_id,
            retailer_id,
            amount_paid: deposit_amount,
            payment_method: 'deposit',
            payment_type: 'bottle_deposit',
            notes: notes || 'Bottle deposit collected',
            created_by: userProfile.id
          })
      }

      console.log(`✅ Bottle exchange processed for retailer ${retailer_id}`)
      console.log(`   - Empties brought: ${empties_brought?.length || 0} types`)
      console.log(`   - Deposit collected: ₦${deposit_amount || 0}`)

      return handleCORS(NextResponse.json({ 
        success: true,
        empties_added: empties_brought?.reduce((sum, e) => sum + e.quantity, 0) || 0,
        deposit_collected: deposit_amount || 0,
        message: 'Bottle exchange recorded successfully' 
      }))
    }

    // ============================================
    // POST: Update Empty Item
    // ============================================
    if (route === 'update-empty-item') {
      if (!['admin', 'manager'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { id, name, deposit_value } = body

      if (!id || !name || !deposit_value) {
        return handleCORS(NextResponse.json({ 
          error: 'Missing required fields: id, name, deposit_value' 
        }, { status: 400 }))
      }

      const { data, error } = await adminSupabase
        .from('empty_items')
        .update({ 
          name,
          deposit_value: parseFloat(deposit_value),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('business_id', userProfile.business_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating empty item:', error)
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }

      console.log(`✅ Empty item updated: ${name}`)
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // POST: Delete Empty Item
    // ============================================
    if (route === 'delete-empty-item') {
      if (!['admin', 'manager'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { id } = body

      if (!id) {
        return handleCORS(NextResponse.json({ 
          error: 'Missing required field: id' 
        }, { status: 400 }))
      }

      // Check if empty item is linked to any products
      const { data: linkedProducts, error: checkError } = await adminSupabase
        .from('products')
        .select('id, name')
        .eq('empty_item_id', id)
        .limit(5)

      if (checkError) {
        console.error('Error checking linked products:', checkError)
      }

      if (linkedProducts && linkedProducts.length > 0) {
        return handleCORS(NextResponse.json({ 
          error: `Cannot delete. This empty item is linked to ${linkedProducts.length} product(s): ${linkedProducts.map(p => p.name).join(', ')}. Please unlink products first.` 
        }, { status: 400 }))
      }

      // Check if there are any movements or inventory
      const { data: movements } = await adminSupabase
        .from('empty_movements')
        .select('id')
        .eq('empty_item_id', id)
        .limit(1)

      if (movements && movements.length > 0) {
        return handleCORS(NextResponse.json({ 
          error: 'Cannot delete. This empty item has movement history. Consider marking it as inactive instead.' 
        }, { status: 400 }))
      }

      // Delete the empty item
      const { error: deleteError } = await adminSupabase
        .from('empty_items')
        .delete()
        .eq('id', id)
        .eq('business_id', userProfile.business_id)

      if (deleteError) {
        console.error('Error deleting empty item:', deleteError)
        return handleCORS(NextResponse.json({ error: deleteError.message }, { status: 400 }))
      }

      console.log(`✅ Empty item deleted: ${id}`)
      return handleCORS(NextResponse.json({ success: true, message: 'Empty item deleted successfully' }))
    }

    // ============================================
    // POST: Return Empties to Manufacturer
    // ============================================
    if (route === 'return-to-manufacturer') {
      if (!['admin', 'manager', 'warehouse'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { empty_item_id, quantity, notes } = body

      // Validate warehouse inventory
      const { data: warehouse } = await adminSupabase
        .from('warehouse_empty_inventory')
        .select('quantity_available')
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)
        .single()

      if (!warehouse || warehouse.quantity_available < quantity) {
        return handleCORS(NextResponse.json({ 
          error: `Insufficient warehouse stock. Available: ${warehouse?.quantity_available || 0}, Requested: ${quantity}` 
        }, { status: 400 }))
      }

      // Reduce warehouse inventory
      const { error: warehouseError } = await adminSupabase
        .from('warehouse_empty_inventory')
        .update({ quantity_available: warehouse.quantity_available - quantity })
        .eq('business_id', userProfile.business_id)
        .eq('empty_item_id', empty_item_id)

      if (warehouseError) throw warehouseError

      // Log movement
      const { data: movement } = await adminSupabase
        .from('empty_movements')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id,
          type: 'returned_to_manufacturer',
          quantity,
          reference_type: 'manufacturer',
          notes,
          created_by: userProfile.id
        })
        .select()
        .single()

      // Send notification
      const { data: emptyItem } = await adminSupabase
        .from('empty_items')
        .select('name')
        .eq('id', empty_item_id)
        .single()

      await sendNotification({
        title: 'Empties Returned to Manufacturer',
        message: `Returned ${quantity} units of ${emptyItem?.name || 'empty items'} to manufacturer.`,
        type: 'info',
        category: 'inventory',
        targetRoles: ['admin', 'manager'],
        businessId: userProfile.business_id,
        triggeredBy: userProfile.id,
        relatedTable: 'empty_movements',
        relatedRecordId: movement.id
      })

      return handleCORS(NextResponse.json({ success: true, movement }))
    }

    // ============================================
    // POST: Manual Adjustment
    // ============================================
    if (route === 'manual-adjustment') {
      if (!['admin', 'manager'].includes(userProfile.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden: Only admin/manager can adjust' }, { status: 403 }))
      }

      const { empty_item_id, adjustment_type, quantity, location, retailer_id, notes } = body
      // location: 'warehouse' or 'retailer'

      if (location === 'warehouse') {
        const { data: warehouse } = await adminSupabase
          .from('warehouse_empty_inventory')
          .select('quantity_available')
          .eq('business_id', userProfile.business_id)
          .eq('empty_item_id', empty_item_id)
          .single()

        const newQty = (warehouse?.quantity_available || 0) + quantity

        await adminSupabase
          .from('warehouse_empty_inventory')
          .update({ quantity_available: newQty })
          .eq('business_id', userProfile.business_id)
          .eq('empty_item_id', empty_item_id)
      } else if (location === 'retailer' && retailer_id) {
        const { data: balance } = await adminSupabase
          .from('retailer_empty_balances')
          .select('quantity_outstanding')
          .eq('business_id', userProfile.business_id)
          .eq('retailer_id', retailer_id)
          .eq('empty_item_id', empty_item_id)
          .single()

        const newQty = (balance?.quantity_outstanding || 0) + quantity

        await adminSupabase
          .from('retailer_empty_balances')
          .upsert({
            business_id: userProfile.business_id,
            retailer_id,
            empty_item_id,
            quantity_outstanding: newQty
          }, { onConflict: 'business_id,retailer_id,empty_item_id' })
      }

      // Log movement
      const { data: movement } = await adminSupabase
        .from('empty_movements')
        .insert({
          business_id: userProfile.business_id,
          empty_item_id,
          retailer_id: retailer_id || null,
          type: adjustment_type, // 'adjustment', 'damaged', 'lost'
          quantity,
          reference_type: 'adjustment',
          notes,
          created_by: userProfile.id
        })
        .select()
        .single()

      // Alert if large adjustment
      if (Math.abs(quantity) > 10) {
        await sendNotification({
          title: 'Large Empty Adjustment',
          message: `Manual adjustment of ${quantity} units (${adjustment_type}) by ${userProfile.role}. Reason: ${notes}`,
          type: 'warning',
          category: 'inventory',
          targetRoles: ['admin'],
          businessId: userProfile.business_id,
          triggeredBy: userProfile.id,
          relatedTable: 'empty_movements',
          relatedRecordId: movement.id
        })
      }

      return handleCORS(NextResponse.json({ success: true, movement }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))

  } catch (error) {
    console.error('Empty bottle API error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
