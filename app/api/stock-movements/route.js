import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to create authenticated Supabase client
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

// Get current user's business ID
async function getUserBusinessId(supabase) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Auth user:', user?.id, 'Error:', null)
    
    if (!user) return null

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User profile:', userProfile, 'Error:', error)

    if (!userProfile) return null

    return {
      businessId: userProfile.business_id,
      role: userProfile.role,
      userId: userProfile.id
    }
  } catch (error) {
    console.error('Error in getUserBusinessId:', error)
    return null
  }
}

function canManageInventory(role) {
  return ['admin', 'manager', 'warehouse'].includes(role)
}

// Audit logging helper
async function logAuditEvent(supabase, userContext, action, details, entityType, resourceId) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        business_id: userContext.businessId,
        user_id: userContext.userId,
        action,
        details,
        entity_type: entityType,
        resource_id: resourceId
      })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}

// GET - List stock movements
export async function GET(request) {
  try {
    const supabase = await getSupabaseClient()
    const userContext = await getUserBusinessId(supabase)
    
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, product:products(name, sku)')
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Stock movements query error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/stock-movements error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create stock movement
export async function POST(request) {
  try {
    const supabase = await getSupabaseClient()
    const userContext = await getUserBusinessId(supabase)
    
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!canManageInventory(userContext.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { product_id, movement_type, quantity, notes } = body

    // Validate inputs
    if (!product_id || !movement_type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['in', 'out'].includes(movement_type)) {
      return NextResponse.json(
        { error: 'Invalid movement_type. Must be "in" or "out"' },
        { status: 400 }
      )
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity, name')
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate new stock quantity
    const currentStock = product.stock_quantity || 0
    const newStock = movement_type === 'in' ? currentStock + qty : currentStock - qty

    if (newStock < 0) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${currentStock}, Requested: ${qty}` },
        { status: 400 }
      )
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)

    if (updateError) {
      console.error('Product update error:', updateError)
      throw updateError
    }

    // Create stock movement record
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        business_id: userContext.businessId,
        product_id,
        movement_type,
        quantity: qty,
        notes: notes || null
      })
      .select()
      .single()

    if (movementError) {
      console.error('Stock movement insert error:', movementError)
      throw movementError
    }

    // Log audit event
    await logAuditEvent(
      supabase,
      userContext,
      'STOCK_MOVEMENT',
      `${movement_type === 'in' ? 'Added' : 'Removed'} ${qty} units of ${product.name}. New stock: ${newStock}`,
      'stock_movement',
      movement.id
    )

    return NextResponse.json(movement)
  } catch (error) {
    console.error('POST /api/stock-movements error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
