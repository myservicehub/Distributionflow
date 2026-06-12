import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { CreateProductSchema, UpdateProductSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendLowStockAlert } from '@/lib/email-alerts'

/**
 * GET /api/products
 * List all products with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)

    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const response = buildPaginationResponse(products || [], count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching products:', error)
    return errorResponse('Failed to fetch products', 500)
  }
}

/**
 * POST /api/products
 * Create a new product
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
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can create products', 403)
  }

  try {
    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(CreateProductSchema, body)
    
    if (validationError) {
      return validationError
    }

    // DUPLICATE CHECK: Check for duplicate product name (case-insensitive)
    const { data: nameExists } = await supabase
      .from('products')
      .select('id, name')
      .eq('business_id', userContext.businessId)
      .ilike('name', validatedData.name.trim())
      .maybeSingle()

    if (nameExists) {
      return errorResponse(
        `A product named "${nameExists.name}" already exists.`,
        409,
        {
          error: 'Duplicate product',
          code: 'DUPLICATE_ENTRY',
          field: 'name'
        }
      )
    }

    // DUPLICATE CHECK: Check for duplicate SKU (only if SKU provided — SKU is optional)
    if (validatedData.sku && validatedData.sku.trim()) {
      const { data: skuExists } = await supabase
        .from('products')
        .select('id, sku')
        .eq('business_id', userContext.businessId)
        .eq('sku', validatedData.sku.trim().toUpperCase())
        .maybeSingle()

      if (skuExists) {
        return errorResponse(
          `SKU "${validatedData.sku}" is already used by another product.`,
          409,
          {
            error: 'Duplicate SKU',
            code: 'DUPLICATE_ENTRY',
            field: 'sku'
          }
        )
      }
    }

    // Create product - map validation fields to actual database columns
    const { quantity, unit_price, cost_price, ...productData } = validatedData
    
    const { data: product, error: createError } = await supabase
      .from('products')
      .insert([{
        ...productData,
        business_id: userContext.businessId,
        selling_price: unit_price,           // Map unit_price -> selling_price
        cost_price: cost_price,              // cost_price exists in DB
        stock_quantity: quantity || 0,       // Map quantity -> stock_quantity
      }])
      .select()
      .single()

    if (createError) throw createError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.PRODUCT,
      product.id,
      { product_name: product.name }
    )

    // Check for low stock and send alert
    if (product.stock_quantity <= product.low_stock_threshold) {
      await sendLowStockAlert(
        userContext.businessId,
        product.name,
        product.stock_quantity,
        product.low_stock_threshold
      )
    }

    return successResponse({ success: true, data: product }, 201)
  } catch (error) {
    console.error('Error creating product:', error)
    return errorResponse('Failed to create product', 500)
  }
}

/**
 * PUT /api/products
 * Update a product (expects product_id in body)
 */
export async function PUT(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Permission check
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can update products', 403)
  }

  try {
    const body = await request.json()
    const { product_id, ...updateData } = body

    if (!product_id) {
      return errorResponse('Product ID is required', 400)
    }

    const { error: validationError, data: validatedData } = parseBody(UpdateProductSchema, updateData)
    
    if (validationError) {
      return validationError
    }

    // DUPLICATE CHECK: Check name conflict with a DIFFERENT product
    if (validatedData.name) {
      const { data: nameConflict } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', userContext.businessId)
        .ilike('name', validatedData.name.trim())
        .neq('id', product_id)
        .maybeSingle()

      if (nameConflict) {
        return errorResponse(
          'Another product with this name already exists.',
          409,
          {
            error: 'Duplicate product',
            code: 'DUPLICATE_ENTRY',
            field: 'name'
          }
        )
      }
    }

    // DUPLICATE CHECK: Check SKU conflict with a DIFFERENT product
    if (validatedData.sku && validatedData.sku.trim()) {
      const { data: skuConflict } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', userContext.businessId)
        .eq('sku', validatedData.sku.trim().toUpperCase())
        .neq('id', product_id)
        .maybeSingle()

      if (skuConflict) {
        return errorResponse(
          `SKU "${validatedData.sku}" is already used by another product.`,
          409,
          {
            error: 'Duplicate SKU',
            code: 'DUPLICATE_ENTRY',
            field: 'sku'
          }
        )
      }
    }

    // Update product - map validation fields to actual database columns
    const { quantity, unit_price, cost_price, ...productData } = validatedData
    
    // Build update object with mapped fields
    const updateFields = {
      ...productData,
      updated_at: new Date().toISOString()
    }
    
    // Only add fields that were actually provided
    if (unit_price !== undefined) updateFields.selling_price = unit_price
    if (cost_price !== undefined) updateFields.cost_price = cost_price
    if (quantity !== undefined) updateFields.stock_quantity = quantity
    
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.UPDATE,
      RESOURCE_TYPES.PRODUCT,
      product.id,
      { product_name: product.name, changes: validatedData }
    )

    return successResponse({ success: true, data: product })
  } catch (error) {
    console.error('Error updating product:', error)
    return errorResponse('Failed to update product', 500)
  }
}

/**
 * DELETE /api/products
 * Delete a product (expects product_id in query params)
 */
export async function DELETE(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Permission check
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can delete products', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    if (!product_id) {
      return errorResponse('Product ID is required', 400)
    }

    // Soft delete (set status to inactive)
    const { data: product, error: deleteError } = await supabase
      .from('products')
      .update({ status: 'inactive' })
      .eq('id', product_id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (deleteError) throw deleteError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.DELETE,
      RESOURCE_TYPES.PRODUCT,
      product.id,
      { product_name: product.name }
    )

    return successResponse({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return errorResponse('Failed to delete product', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
