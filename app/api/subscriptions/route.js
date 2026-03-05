// Subscription Management API
// Handles plans, subscriptions, billing, and Paystack integration

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  getAvailablePlans,
  getSubscriptionDetails,
  calculateSubscriptionAmount,
  createSubscription,
  updateBusinessSubscription,
  logSubscriptionEvent,
  canAddUser,
  getInvoices,
  createInvoice,
  hasFeature,
  FEATURES
} from '@/lib/subscription'
import {
  initializeTransaction,
  verifyTransaction,
  generatePaymentReference,
  toKobo,
  validateWebhookSignature,
  getPaystackPublicKey
} from '@/lib/paystack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
        } catch {}
      },
    },
  })
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

export async function GET(request) {
  const supabase = await getSupabaseClient()
  const { searchParams } = new URL(request.url)
  const route = searchParams.get('route')

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, business_id, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) {
      return handleCORS(NextResponse.json({ error: 'User profile not found' }, { status: 401 }))
    }

    // ============================================
    // GET: Available Plans
    // ============================================
    if (route === 'plans') {
      const plans = await getAvailablePlans()
      return handleCORS(NextResponse.json(plans))
    }

    // ============================================
    // GET: Current Subscription Details
    // ============================================
    if (route === 'subscription') {
      const details = await getSubscriptionDetails(userProfile.business_id)
      return handleCORS(NextResponse.json(details))
    }

    // ============================================
    // GET: Calculate Billing for Current or New Plan
    // ============================================
    if (route === 'calculate-billing') {
      const planId = searchParams.get('plan_id')
      const billing = await calculateSubscriptionAmount(userProfile.business_id, planId)
      return handleCORS(NextResponse.json(billing))
    }

    // ============================================
    // GET: Check User Limit
    // ============================================
    if (route === 'check-user-limit') {
      const result = await canAddUser(userProfile.business_id)
      return handleCORS(NextResponse.json(result))
    }

    // ============================================
    // GET: Invoices
    // ============================================
    if (route === 'invoices') {
      const limit = parseInt(searchParams.get('limit') || '10')
      const invoices = await getInvoices(userProfile.business_id, limit)
      return handleCORS(NextResponse.json(invoices))
    }

    // ============================================
    // GET: Check Feature Access
    // ============================================
    if (route === 'check-feature') {
      const featureName = searchParams.get('feature')
      if (!featureName) {
        return handleCORS(NextResponse.json({ error: 'Feature name required' }, { status: 400 }))
      }
      const hasAccess = await hasFeature(userProfile.business_id, featureName)
      return handleCORS(NextResponse.json({ feature: featureName, hasAccess }))
    }

    // ============================================
    // GET: Paystack Public Key
    // ============================================
    if (route === 'paystack-key') {
      const publicKey = getPaystackPublicKey()
      return handleCORS(NextResponse.json({ publicKey }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))

  } catch (error) {
    console.error('Subscription API error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}

export async function POST(request) {
  const supabase = await getSupabaseClient()
  const body = await request.json()
  const route = body.route

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, business_id, role, status, name, email')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) {
      return handleCORS(NextResponse.json({ error: 'User profile not found' }, { status: 401 }))
    }

    // ============================================
    // POST: Initialize Payment (Start Subscription)
    // ============================================
    if (route === 'initialize-payment') {
      // Only admins can manage subscriptions
      if (userProfile.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Only admins can manage subscriptions' }, { status: 403 }))
      }

      const { plan_id, billing_cycle } = body

      // Calculate billing amount
      const billing = await calculateSubscriptionAmount(userProfile.business_id, plan_id)
      
      if (!billing) {
        return handleCORS(NextResponse.json({ error: 'Unable to calculate billing' }, { status: 400 }))
      }

      // Generate unique reference
      const reference = generatePaymentReference(userProfile.business_id)

      // Initialize Paystack transaction
      const payment = await initializeTransaction({
        email: userProfile.email,
        amount: billing.total_amount,
        reference,
        metadata: {
          business_id: userProfile.business_id,
          plan_id,
          billing_cycle: billing_cycle || 'monthly',
          type: 'subscription_payment'
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing/verify?reference=${reference}`
      })

      // Create pending subscription record
      await createSubscription({
        business_id: userProfile.business_id,
        plan_id,
        base_price: billing.base_price,
        included_users: billing.included_users,
        active_users: billing.active_users,
        extra_users: billing.extra_users,
        price_per_extra_user: billing.price_per_extra_user,
        total_amount: billing.total_amount,
        billing_cycle: billing_cycle || 'monthly',
        status: 'pending',
        payment_provider_reference: reference
      })

      return handleCORS(NextResponse.json({
        authorization_url: payment.authorization_url,
        reference,
        amount: billing.total_amount
      }))
    }

    // ============================================
    // POST: Verify Payment
    // ============================================
    if (route === 'verify-payment') {
      const { reference } = body

      // Verify transaction with Paystack
      const transaction = await verifyTransaction(reference)

      if (transaction.status !== 'success') {
        return handleCORS(NextResponse.json({ 
          success: false, 
          message: 'Payment verification failed' 
        }, { status: 400 }))
      }

      // Update subscription to active
      const { data: subscription } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_provider_reference: transaction.reference,
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('payment_provider_reference', reference)
        .select()
        .single()

      // Update business subscription status
      await updateBusinessSubscription(userProfile.business_id, {
        subscription_status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_id: subscription.plan_id,
        billing_cycle: subscription.billing_cycle
      })

      // Log event
      await logSubscriptionEvent({
        business_id: userProfile.business_id,
        subscription_id: subscription.id,
        event_type: 'subscription_created',
        new_status: 'active',
        new_plan_id: subscription.plan_id,
        metadata: { transaction_reference: reference, amount: transaction.amount }
      })

      // Create invoice
      await createInvoice({
        subscription_id: subscription.id,
        business_id: userProfile.business_id,
        amount: subscription.total_amount,
        base_price: subscription.base_price,
        extra_users_count: subscription.extra_users,
        extra_users_cost: subscription.extra_users * subscription.price_per_extra_user,
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_provider_reference: reference
      })

      return handleCORS(NextResponse.json({ 
        success: true, 
        message: 'Subscription activated successfully' 
      }))
    }

    // ============================================
    // POST: Upgrade Plan
    // ============================================
    if (route === 'upgrade-plan') {
      if (userProfile.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Only admins can upgrade plans' }, { status: 403 }))
      }

      const { new_plan_id } = body

      // Calculate new billing
      const newBilling = await calculateSubscriptionAmount(userProfile.business_id, new_plan_id)

      if (!newBilling) {
        return handleCORS(NextResponse.json({ error: 'Invalid plan' }, { status: 400 }))
      }

      // Get current plan for comparison
      const currentDetails = await getSubscriptionDetails(userProfile.business_id)

      // Log the upgrade intent
      await logSubscriptionEvent({
        business_id: userProfile.business_id,
        event_type: 'plan_upgrade_initiated',
        previous_plan_id: currentDetails.plan_id,
        new_plan_id,
        metadata: { 
          old_price: currentDetails.plans.base_price,
          new_price: newBilling.base_price
        }
      })

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Proceed to payment to complete upgrade',
        new_billing: newBilling
      }))
    }

    // ============================================
    // POST: Downgrade Plan (Scheduled)
    // ============================================
    if (route === 'downgrade-plan') {
      if (userProfile.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Only admins can downgrade plans' }, { status: 403 }))
      }

      const { new_plan_id } = body

      // Calculate new billing
      const newBilling = await calculateSubscriptionAmount(userProfile.business_id, new_plan_id)

      // Check if active users exceed new plan's included users
      if (newBilling.active_users > newBilling.included_users) {
        const excessUsers = newBilling.active_users - newBilling.included_users
        return handleCORS(NextResponse.json({ 
          error: `Cannot downgrade: You have ${excessUsers} more active users than the new plan allows. Please deactivate users first.`,
          excess_users: excessUsers
        }, { status: 400 }))
      }

      // Schedule downgrade for next billing cycle
      await logSubscriptionEvent({
        business_id: userProfile.business_id,
        event_type: 'plan_downgrade_scheduled',
        previous_plan_id: (await getSubscriptionDetails(userProfile.business_id)).plan_id,
        new_plan_id,
        metadata: { scheduled_for_next_billing_cycle: true }
      })

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Plan downgrade scheduled for next billing cycle'
      }))
    }

    // ============================================
    // POST: Cancel Subscription
    // ============================================
    if (route === 'cancel-subscription') {
      if (userProfile.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Only admins can cancel subscriptions' }, { status: 403 }))
      }

      await updateBusinessSubscription(userProfile.business_id, {
        subscription_status: 'cancelled'
      })

      await logSubscriptionEvent({
        business_id: userProfile.business_id,
        event_type: 'subscription_cancelled',
        previous_status: 'active',
        new_status: 'cancelled',
        metadata: { cancelled_at: new Date().toISOString() }
      })

      return handleCORS(NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      }))
    }

    return handleCORS(NextResponse.json({ error: 'Route not found' }, { status: 404 }))

  } catch (error) {
    console.error('Subscription API error:', error)
    return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
  }
}
