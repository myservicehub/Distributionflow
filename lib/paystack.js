// Paystack Integration for Subscription Billing
// Server-side only

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder'
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder'
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/**
 * Make authenticated request to Paystack API
 */
async function paystackRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, options)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Paystack API error')
    }

    return result
  } catch (error) {
    console.error('Paystack API error:', error)
    throw error
  }
}

/**
 * Initialize Paystack transaction
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} { authorization_url, access_code, reference }
 */
export async function initializeTransaction({
  email,
  amount, // Amount in kobo (smallest currency unit)
  reference,
  metadata = {},
  callback_url = null
}) {
  try {
    const result = await paystackRequest('/transaction/initialize', 'POST', {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      metadata,
      callback_url
    })

    return result.data
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error)
    throw error
  }
}

/**
 * Create Paystack subscription
 * @param {Object} params - Subscription parameters
 * @returns {Promise<Object>}
 */
export async function createPaystackSubscription({
  customer,
  plan_code,
  authorization,
  start_date = null
}) {
  try {
    const result = await paystackRequest('/subscription', 'POST', {
      customer,
      plan: plan_code,
      authorization,
      start_date
    })

    return result.data
  } catch (error) {
    console.error('Error creating Paystack subscription:', error)
    throw error
  }
}

/**
 * Create or retrieve Paystack customer
 * @param {Object} params - Customer details
 * @returns {Promise<Object>}
 */
export async function createPaystackCustomer({
  email,
  first_name,
  last_name,
  phone = null
}) {
  try {
    const result = await paystackRequest('/customer', 'POST', {
      email,
      first_name,
      last_name,
      phone
    })

    return result.data
  } catch (error) {
    console.error('Error creating Paystack customer:', error)
    throw error
  }
}

/**
 * Verify Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>}
 */
export async function verifyTransaction(reference) {
  try {
    const result = await paystackRequest(`/transaction/verify/${reference}`)
    return result.data
  } catch (error) {
    console.error('Error verifying transaction:', error)
    throw error
  }
}

/**
 * Cancel Paystack subscription
 * @param {string} code - Subscription code
 * @param {string} token - Email token
 * @returns {Promise<boolean>}
 */
export async function cancelSubscription(code, token) {
  try {
    await paystackRequest('/subscription/disable', 'POST', {
      code,
      token
    })
    return true
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

/**
 * Get Paystack subscription details
 * @param {string} id_or_code - Subscription ID or code
 * @returns {Promise<Object>}
 */
export async function getSubscription(id_or_code) {
  try {
    const result = await paystackRequest(`/subscription/${id_or_code}`)
    return result.data
  } catch (error) {
    console.error('Error getting subscription:', error)
    throw error
  }
}

/**
 * Validate Paystack webhook signature
 * @param {string} signature - X-Paystack-Signature header
 * @param {string} body - Raw request body
 * @returns {boolean}
 */
export function validateWebhookSignature(signature, body) {
  const crypto = require('crypto')
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')

  return hash === signature
}

/**
 * Generate unique payment reference
 * @param {string} businessId - Business UUID
 * @returns {string}
 */
export function generatePaymentReference(businessId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SUB-${businessId.substring(0, 8).toUpperCase()}-${timestamp}-${random}`
}

/**
 * Calculate amount in kobo (Paystack uses smallest currency unit)
 * @param {number} amount - Amount in Naira
 * @returns {number}
 */
export function toKobo(amount) {
  return Math.round(amount * 100)
}

/**
 * Calculate amount in Naira from kobo
 * @param {number} kobo - Amount in kobo
 * @returns {number}
 */
export function fromKobo(kobo) {
  return kobo / 100
}

/**
 * Get Paystack public key (for frontend)
 * @returns {string}
 */
export function getPaystackPublicKey() {
  return PAYSTACK_PUBLIC_KEY
}

/**
 * Create Paystack plan (one-time setup)
 * @param {Object} params - Plan parameters
 * @returns {Promise<Object>}
 */
export async function createPaystackPlan({
  name,
  amount, // Amount in kobo
  interval, // monthly, yearly, etc.
  description = '',
  currency = 'NGN'
}) {
  try {
    const result = await paystackRequest('/plan', 'POST', {
      name,
      amount: Math.round(amount * 100),
      interval,
      description,
      currency
    })

    return result.data
  } catch (error) {
    console.error('Error creating Paystack plan:', error)
    throw error
  }
}

// Export constants
export const PAYSTACK_INTERVALS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  QUARTERLY: 'quarterly',
  BIANNUALLY: 'biannually'
}

export const PAYSTACK_CHANNELS = {
  CARD: 'card',
  BANK: 'bank',
  USSD: 'ussd',
  QR: 'qr',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer'
}
