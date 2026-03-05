// Paystack Webhook Handler
// Receives payment notifications from Paystack

import { NextResponse } from 'next/server'
import { validateWebhookSignature } from '@/lib/paystack'
import {
  updateBusinessSubscription,
  logSubscriptionEvent,
  createInvoice
} from '@/lib/subscription'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request) {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Validate webhook signature
    if (!validateWebhookSignature(signature, rawBody)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('Paystack webhook event:', event.event)

    const supabase = getAdminClient()

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(supabase, event.data)
        break

      case 'subscription.create':
        await handleSubscriptionCreate(supabase, event.data)
        break

      case 'subscription.disable':
        await handleSubscriptionDisable(supabase, event.data)
        break

      case 'subscription.not_renew':
        await handleSubscriptionNotRenew(supabase, event.data)
        break

      case 'invoice.create':
      case 'invoice.update':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(supabase, event)
        break

      default:
        console.log('Unhandled event type:', event.event)
    }

    return NextResponse.json({ status: 'success' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleChargeSuccess(supabase, data) {
  try {
    const { reference, metadata } = data

    if (metadata?.type !== 'subscription_payment') {
      return
    }

    // Update subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_provider_reference: reference,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('payment_provider_reference', reference)

    if (error) throw error

    // Update business
    await updateBusinessSubscription(metadata.business_id, {
      subscription_status: 'active',
      subscription_start: new Date().toISOString(),
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Log event
    await logSubscriptionEvent({
      business_id: metadata.business_id,
      event_type: 'payment_succeeded',
      new_status: 'active',
      metadata: { reference, amount: data.amount }
    })

    console.log('Charge success handled:', reference)
  } catch (error) {
    console.error('Error handling charge success:', error)
  }
}

async function handleSubscriptionCreate(supabase, data) {
  try {
    console.log('Subscription created:', data.subscription_code)

    // Update subscription with Paystack subscription code
    const { error } = await supabase
      .from('subscriptions')
      .update({
        payment_provider_subscription_code: data.subscription_code
      })
      .eq('payment_provider_reference', data.reference)

    if (error) throw error
  } catch (error) {
    console.error('Error handling subscription create:', error)
  }
}

async function handleSubscriptionDisable(supabase, data) {
  try {
    console.log('Subscription disabled:', data.subscription_code)

    // Find subscription by code
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('business_id')
      .eq('payment_provider_subscription_code', data.subscription_code)
      .single()

    if (subscription) {
      await updateBusinessSubscription(subscription.business_id, {
        subscription_status: 'cancelled'
      })

      await logSubscriptionEvent({
        business_id: subscription.business_id,
        event_type: 'subscription_cancelled',
        metadata: { subscription_code: data.subscription_code }
      })
    }
  } catch (error) {
    console.error('Error handling subscription disable:', error)
  }
}

async function handleSubscriptionNotRenew(supabase, data) {
  try {
    console.log('Subscription not renewing:', data.subscription_code)

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('business_id')
      .eq('payment_provider_subscription_code', data.subscription_code)
      .single()

    if (subscription) {
      await logSubscriptionEvent({
        business_id: subscription.business_id,
        event_type: 'subscription_not_renewing',
        metadata: { subscription_code: data.subscription_code }
      })
    }
  } catch (error) {
    console.error('Error handling subscription not renew:', error)
  }
}

async function handleInvoiceEvent(supabase, event) {
  try {
    console.log('Invoice event:', event.event)
    // Handle invoice-related events as needed
  } catch (error) {
    console.error('Error handling invoice event:', error)
  }
}
