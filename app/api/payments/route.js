import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { CreatePaymentSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendNotification } from '@/lib/notifications'

// Helper to apply sales rep filter
function applySalesRepFilter(query, userContext) {
  if (userContext.role === 'sales_rep') {
    // Sales reps see payments for their retailers only
    return query.filter('retailers.assigned_rep_id', 'eq', userContext.userId)
  }
  return query
}

/**
 * GET /api/payments
 * List all payments with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)

    let query = supabase
      .from('payments')
      .select('*, retailers(shop_name, owner_name, assigned_rep_id), users!payments_received_by_fkey(name)', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply sales rep filter
    query = applySalesRepFilter(query, userContext)

    const { data: payments, error, count } = await query

    if (error) throw error

    // Format response
    const formattedPayments = (payments || []).map(payment => ({
      ...payment,
      retailer_name: payment.retailers?.shop_name || 'N/A',
      received_by_name: payment.users?.name || 'N/A'
    }))

    const response = buildPaginationResponse(formattedPayments, count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return errorResponse('Failed to fetch payments', 500)
  }
}

/**
 * POST /api/payments
 * Record a new payment
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

  try {
    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(CreatePaymentSchema, body)
    
    if (validationError) {
      return validationError
    }

    // DOUBLE-SUBMIT GUARD: Check for identical payment in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
    const { data: recentDuplicate } = await supabase
      .from('payments')
      .select('id, created_at')
      .eq('business_id', userContext.businessId)
      .eq('retailer_id', validatedData.retailer_id)
      .eq('amount_paid', validatedData.amount_paid)
      .eq('payment_method', validatedData.payment_method)
      .gte('created_at', thirtySecondsAgo)
      .maybeSingle()

    if (recentDuplicate) {
      return errorResponse(
        'An identical payment was just recorded for this retailer. If this is intentional, please wait 30 seconds and try again.',
        409,
        {
          error: 'Duplicate payment',
          code: 'DUPLICATE_PAYMENT'
        }
      )
    }

    // Get current retailer balance
    const { data: retailer } = await supabase
      .from('retailers')
      .select('current_balance, shop_name')
      .eq('id', validatedData.retailer_id)
      .eq('business_id', userContext.businessId)
      .single()

    if (!retailer) {
      return errorResponse('Retailer not found', 404)
    }

    const currentBalance = parseFloat(retailer.current_balance || 0)
    const paymentAmount = parseFloat(validatedData.amount_paid)

    // Create payment record
    const { data: payment, error: createError } = await supabase
      .from('payments')
      .insert([{
        business_id: userContext.businessId,
        retailer_id: validatedData.retailer_id,
        amount_paid: paymentAmount,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes || null,
        recorded_by: userContext.userId
      }])
      .select()
      .single()

    if (createError) throw createError

    // Update retailer balance
    const newBalance = Math.max(0, currentBalance - paymentAmount)
    
    const { error: updateError } = await supabase
      .from('retailers')
      .update({ current_balance: newBalance })
      .eq('id', validatedData.retailer_id)
      .eq('business_id', userContext.businessId)

    if (updateError) throw updateError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.PAYMENT,
      payment.id,
      {
        retailer: retailer.shop_name,
        amount: paymentAmount,
        method: validatedData.payment_method,
        old_balance: currentBalance,
        new_balance: newBalance
      }
    )

    // Notification to managers
    await sendNotification(
      supabase,
      null,
      userContext.businessId,
      'payment_received',
      `Payment of ₦${paymentAmount.toLocaleString()} received from ${retailer.shop_name}`,
      { payment_id: payment.id, retailer_id: validatedData.retailer_id }
    )

    return successResponse({ 
      success: true, 
      data: payment,
      new_balance: newBalance 
    }, 201)
  } catch (error) {
    console.error('Error creating payment:', error)
    return errorResponse('Failed to create payment', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
