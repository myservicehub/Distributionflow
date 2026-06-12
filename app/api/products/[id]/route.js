import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { UpdateProductSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'

export async function GET(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', userContext.businessId)
    .single()

  if (error || !product) return errorResponse('Product not found', 404)
  return successResponse(product)
}

export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) return errorResponse(subscriptionError.message, 402)

  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can update products', 403)
  }

  try {
    const body = await request.json()

    // Support both full product update and partial update (e.g. for empty-bottle linking)
    let validatedData = body
    if (UpdateProductSchema) {
      const result = parseBody(UpdateProductSchema, body)
      // Only validate if UpdateProductSchema exists and validation passes
      if (result.error && !body.empty_item_id) {
        return result.error
      }
      if (result.data) {
        validatedData = result.data
      }
    }

    // Duplicate name check (exclude current record)
    if (validatedData.name) {
      const { data: nameExists } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', userContext.businessId)
        .ilike('name', validatedData.name.trim())
        .neq('id', params.id)
        .maybeSingle()

      if (nameExists) {
        return errorResponse('A product with this name already exists.', 409, {
          error: 'Duplicate product', code: 'DUPLICATE_ENTRY', field: 'name'
        })
      }
    }

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.PRODUCT, product.id,
      { product_name: product.name })

    return successResponse({ success: true, data: product })
  } catch (error) {
    console.error('Error updating product:', error)
    return errorResponse('Failed to update product', 500)
  }
}

// PATCH handler for partial updates (e.g., linking empty bottles)
// Uses the same logic as PUT
export async function PATCH(request, { params }) {
  return PUT(request, { params })
}

export async function DELETE(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can delete products', 403)
  }

  try {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .single()

    if (!product) return errorResponse('Product not found', 404)

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)

    if (deleteError) throw deleteError

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.DELETE, RESOURCE_TYPES.PRODUCT, params.id,
      { product_name: product.name })

    return successResponse({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return errorResponse('Failed to delete product', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
