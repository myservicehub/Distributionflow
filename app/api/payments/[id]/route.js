import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'

export async function GET(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*, retailers(shop_name), orders(order_number, total_amount)')
    .eq('id', params.id)
    .eq('business_id', userContext.businessId)
    .single()

  if (error || !payment) return errorResponse('Payment not found', 404)
  return successResponse(payment)
}

export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) return errorResponse(subscriptionError.message, 402)

  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can update payments', 403)
  }

  try {
    const body = await request.json()

    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError
    if (!payment) return errorResponse('Payment not found', 404)

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.PAYMENT, payment.id,
      { amount: payment.amount_paid })

    return successResponse({ success: true, data: payment })
  } catch (error) {
    console.error('Error updating payment:', error)
    return errorResponse('Failed to update payment', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
