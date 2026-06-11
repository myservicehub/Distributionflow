import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { UpdateRetailerSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'

export async function GET(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const { data: retailer, error } = await supabase
    .from('retailers')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', userContext.businessId)
    .single()

  if (error || !retailer) return errorResponse('Retailer not found', 404)
  return successResponse(retailer)
}

export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) return errorResponse(subscriptionError.message, 402)

  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can update retailers', 403)
  }

  try {
    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(UpdateRetailerSchema, body)
    if (validationError) return validationError

    // Duplicate check (exclude current record)
    if (validatedData.shop_name) {
      const { data: byName } = await supabase
        .from('retailers')
        .select('id')
        .eq('business_id', userContext.businessId)
        .ilike('shop_name', validatedData.shop_name.trim())
        .neq('id', params.id)
        .maybeSingle()

      if (byName) {
        return errorResponse('A retailer with this shop name already exists.', 409, {
          error: 'Duplicate retailer', code: 'DUPLICATE_ENTRY', field: 'shop_name'
        })
      }
    }

    const { data: retailer, error: updateError } = await supabase
      .from('retailers')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.RETAILER, retailer.id,
      { retailer_name: retailer.shop_name })

    return successResponse({ success: true, data: retailer })
  } catch (error) {
    console.error('Error updating retailer:', error)
    return errorResponse('Failed to update retailer', 500)
  }
}

export async function DELETE(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can delete retailers', 403)
  }

  try {
    const { data: retailer } = await supabase
      .from('retailers')
      .select('shop_name')
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .single()

    if (!retailer) return errorResponse('Retailer not found', 404)

    const { error: deleteError } = await supabase
      .from('retailers')
      .delete()
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)

    if (deleteError) throw deleteError

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.DELETE, RESOURCE_TYPES.RETAILER, params.id,
      { retailer_name: retailer.shop_name })

    return successResponse({ success: true })
  } catch (error) {
    console.error('Error deleting retailer:', error)
    return errorResponse('Failed to delete retailer', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
