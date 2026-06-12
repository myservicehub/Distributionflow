import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'

/**
 * GET /api/stock-movements
 * Get stock movements with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)

    // Select with correct column names after migration
    const { data: movements, error, count } = await supabase
      .from('stock_movements')
      .select('id, product_id, type, quantity, quantity_before, quantity_after, notes, created_at, business_id, user_id, products(name)', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching stock movements:', error)
      throw error
    }

    // Format response with type (was movement_type)
    const formattedMovements = (movements || []).map(movement => ({
      ...movement,
      movement_type: movement.type  // Map type back to movement_type for frontend compatibility
    }))
      ...movement,
      product_name: movement.products?.name || 'N/A',
      user_name: 'System' // Default since user_id FK is broken
    }))

    const response = buildPaginationResponse(formattedMovements, count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return errorResponse('Failed to fetch stock movements', 500)
  }
}

/**
 * POST /api/stock-movements
 * Record a stock movement (in/out/adjustment)
 */
export async function POST(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Subscription check
  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) {
    return errorResponse(subscriptionError.message, 402)
  }

  // Permission check
  if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only authorized staff can record stock movements', 403)
  }

  try {
    const body = await request.json()
    const { product_id, movement_type, type, quantity, notes } = body
    
    // Accept either movement_type or type for backwards compatibility
    const movementType = type || movement_type

    if (!product_id || !movementType || !quantity) {
      return errorResponse('Product ID, movement type, and quantity are required', 400)
    }

    if (!['in', 'out', 'adjustment'].includes(movementType)) {
      return errorResponse('Invalid movement type. Must be in, out, or adjustment', 400)
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      return errorResponse('Quantity must be a positive number', 400)
    }

    // Get current product stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, name')
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)
      .single()

    if (!product) {
      return errorResponse('Product not found', 404)
    }

    const currentStock = product.stock_quantity || 0
    let newStock = currentStock

    // Calculate new stock based on movement type
    if (movementType === 'in') {
      newStock = currentStock + qty
    } else if (movementType === 'out') {
      newStock = Math.max(0, currentStock - qty)
    } else if (movementType === 'adjustment') {
      newStock = qty // Set to exact quantity
    }

    // Create movement record
    const { data: movement, error: createError } = await supabase
      .from('stock_movements')
      .insert([{
        business_id: userContext.businessId,
        product_id,
        type: movementType,  // Use 'type' column
        quantity: qty,
        quantity_before: currentStock,
        quantity_after: newStock,
        notes: notes || null,
        user_id: userContext.userId
      }])
      .select()
      .single()

    if (createError) throw createError

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)

    if (updateError) throw updateError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.UPDATE,
      RESOURCE_TYPES.PRODUCT,
      product_id,
      {
        product_name: product.name,
        movement_type,
        quantity: qty,
        old_stock: currentStock,
        new_stock: newStock
      }
    )

    return successResponse({ 
      success: true, 
      data: movement,
      new_stock: newStock 
    }, 201)
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return errorResponse('Failed to create stock movement', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
