// Subscription Management API
// Handles plans, subscriptions, billing, and Paystack integration

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
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
    // GET: Available Plans (for billing dashboard)
    // ============================================
    if (route === 'get-plans') {
      const plans = await getAvailablePlans()
      return handleCORS(NextResponse.json({ success: true, data: plans }))
    }

    // ============================================
    // GET: Available Plans (legacy)
    // ============================================
    if (route === 'plans') {
      const plans = await getAvailablePlans()
      return handleCORS(NextResponse.json(plans))
    }

    // ============================================
    // GET: Billing Details (comprehensive)
    // ============================================
    if (route === 'get-billing-details') {
      const details = await getSubscriptionDetails(userProfile.business_id)
      const billing = await calculateSubscriptionAmount(userProfile.business_id)
      
      return handleCORS(NextResponse.json({
        success: true,
        data: {
          ...details,
          active_users: billing?.active_users || 0,
          total_amount: billing?.total_amount || 0,
          extra_users: billing?.extra_users || 0
        }
      }))
    }

    // ============================================
    // GET: Current Subscription Details (legacy)
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
    // GET: View Invoice (for download/view)
    // ============================================
    if (route === 'view-invoice') {
      const invoiceId = searchParams.get('invoice_id')
      if (!invoiceId) {
        return handleCORS(NextResponse.json({ error: 'Invoice ID required' }, { status: 400 }))
      }

      const supabase = getAdminClient()
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          businesses(name, email, address, phone),
          plans(display_name, base_price)
        `)
        .eq('id', invoiceId)
        .eq('business_id', userProfile.business_id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching invoice:', error)
        return handleCORS(NextResponse.json({ error: 'Error fetching invoice: ' + error.message }, { status: 500 }))
      }

      if (!invoice) {
        console.error('Invoice not found:', invoiceId, 'for business:', userProfile.business_id)
        return handleCORS(NextResponse.json({ error: 'Invoice not found' }, { status: 404 }))
      }

      // Generate HTML invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
            .header h1 { color: #059669; margin: 0; }
            .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .company-info, .invoice-details { }
            .invoice-details { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: 600; }
            .total { text-align: right; font-size: 1.5em; font-weight: bold; color: #059669; }
            .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
            .status-paid { background-color: #d1fae5; color: #065f46; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DISTRIBUTIONFLOW</h1>
            <p>Invoice Receipt</p>
          </div>

          <div class="invoice-info">
            <div class="company-info">
              <h3>Bill To:</h3>
              <p><strong>${invoice.businesses?.name || 'N/A'}</strong></p>
              <p>${invoice.businesses?.email || 'N/A'}</p>
              <p>${invoice.businesses?.phone || 'N/A'}</p>
              <p>${invoice.businesses?.address || 'N/A'}</p>
            </div>
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Plan</th>
                <th>Period</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Subscription Payment</td>
                <td>${invoice.plans?.display_name || 'N/A'}</td>
                <td>${invoice.billing_period_start ? new Date(invoice.billing_period_start).toLocaleDateString('en-GB') : 'N/A'} - ${invoice.billing_period_end ? new Date(invoice.billing_period_end).toLocaleDateString('en-GB') : 'N/A'}</td>
                <td style="text-align: right;">₦${(invoice.amount || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total: ₦${(invoice.amount || 0).toLocaleString()}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>For support, contact us at support@distributionflow.com</p>
          </div>
        </body>
        </html>
      `

      return new NextResponse(invoiceHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`
        }
      })
    }

    // ============================================
    // GET: Invoices (for billing dashboard)
    // ============================================
    if (route === 'get-invoices') {
      const limit = parseInt(searchParams.get('limit') || '10')
      const invoices = await getInvoices(userProfile.business_id, limit)
      return handleCORS(NextResponse.json({ success: true, data: invoices }))
    }

    // ============================================
    // GET: Invoices (legacy)
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

  console.log('POST /api/subscriptions - Route:', route, 'Body:', JSON.stringify(body))

  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('POST /api/subscriptions - No user found')
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, business_id, role, status, name, email')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userProfile || !userProfile.business_id) {
      console.log('POST /api/subscriptions - No user profile found')
      return handleCORS(NextResponse.json({ error: 'User profile not found' }, { status: 401 }))
    }

    console.log('POST /api/subscriptions - User profile:', userProfile.role, userProfile.business_id)

    // ============================================
    // POST: Initialize Payment (Start Subscription)
    // ============================================
    if (route === 'initialize-payment') {
      console.log('POST /api/subscriptions - Initialize payment route matched')
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

      console.log('Verifying payment with reference:', reference)

      // Verify transaction with Paystack
      const transaction = await verifyTransaction(reference)

      console.log('Transaction verification result:', transaction.status)

      if (transaction.status !== 'success') {
        return handleCORS(NextResponse.json({ 
          success: false, 
          error: 'Payment verification failed',
          message: 'Payment could not be verified with Paystack' 
        }, { status: 400 }))
      }

      // Find subscription by business_id and status pending (most recent)
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', userProfile.business_id)
        .in('status', ['pending', 'created'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('Found subscription:', subscription?.id, 'Status:', subscription?.status, 'Error:', subError)

      if (!subscription) {
        return handleCORS(NextResponse.json({ 
          success: false, 
          error: 'No pending subscription found',
          message: 'Could not find a subscription to activate' 
        }, { status: 404 }))
      }

      // Update subscription to active - use the subscription ID directly
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_provider_reference: transaction.reference,
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', subscription.id)
        .select()
        .maybeSingle()

      console.log('Update result:', updatedSubscription?.id, 'Error:', updateError)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return handleCORS(NextResponse.json({ 
          success: false, 
          error: 'Failed to activate subscription',
          message: updateError?.message || 'Database update failed' 
        }, { status: 500 }))
      }

      // If update didn't return the subscription (already active?), use the original
      const finalSubscription = updatedSubscription || subscription

      console.log('Subscription activated successfully:', finalSubscription.id)

      // Update business subscription status
      await updateBusinessSubscription(userProfile.business_id, {
        subscription_status: 'active',
        subscription_start: new Date().toISOString(),
        subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_id: finalSubscription.plan_id,
        billing_cycle: finalSubscription.billing_cycle
      })

      // Get plan name
      const { data: plan } = await supabase
        .from('plans')
        .select('name')
        .eq('id', finalSubscription.plan_id)
        .single()

      // Log event
      await logSubscriptionEvent({
        business_id: userProfile.business_id,
        subscription_id: finalSubscription.id,
        event_type: 'subscription_created',
        new_status: 'active',
        new_plan_id: finalSubscription.plan_id,
        metadata: { transaction_reference: reference, amount: transaction.amount }
      })

      // Create invoice
      await createInvoice({
        subscription_id: finalSubscription.id,
        business_id: userProfile.business_id,
        amount: finalSubscription.total_amount,
        base_price: finalSubscription.base_price,
        extra_users_count: finalSubscription.extra_users || 0,
        extra_users_cost: (finalSubscription.extra_users || 0) * (finalSubscription.price_per_extra_user || 0),
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_provider_reference: reference
      })

      return handleCORS(NextResponse.json({ 
        success: true, 
        message: 'Subscription activated successfully',
        subscription: {
          id: finalSubscription.id,
          plan_name: plan?.name || 'Business Plan',
          status: 'active'
        }
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
