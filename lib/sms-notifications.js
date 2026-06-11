/**
 * Termii SMS Notifications
 * Documentation: https://developers.termii.com/messaging
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Distroflow'
const TERMII_API_URL = process.env.TERMII_API_URL || 'https://api.ng.termii.com/api/sms/send'

/**
 * Send SMS notification via Termii
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (E.164 format: +234...)
 * @param {string} params.message - SMS message content
 * @param {string} params.channel - Termii channel type (generic, dnd, whatsapp)
 * @returns {Promise<Object>}
 */
async function sendTermiiSMS({ to, message, channel = 'generic' }) {
  // If Termii not configured, log and return
  if (!TERMII_API_KEY || TERMII_API_KEY === 'YOUR_TERMII_API_KEY') {
    console.log('Termii not configured. SMS would be sent to:', to)
    console.log('Message:', message)
    return { 
      success: false, 
      error: 'Termii not configured',
      mock: true 
    }
  }

  // Validate phone number format
  if (!to || !to.startsWith('+')) {
    console.error('Invalid phone number format. Must be E.164 format (e.g., +2348012345678)')
    return { success: false, error: 'Invalid phone number format' }
  }

  try {
    const payload = {
      to: to,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: channel,
      api_key: TERMII_API_KEY
    }

    const response = await fetch(TERMII_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (response.ok && result.message_id) {
      console.log('SMS sent successfully via Termii:', result.message_id)
      return { 
        success: true, 
        messageId: result.message_id,
        status: result.status || 'sent'
      }
    } else {
      console.error('Termii SMS failed:', result)
      return { 
        success: false, 
        error: result.message || 'Failed to send SMS via Termii'
      }
    }
  } catch (error) {
    console.error('Failed to send SMS via Termii:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

/**
 * Send SMS notification for delivery status
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (E.164 format: +234...)
 * @param {string} params.orderReference - Order ID or reference
 * @param {string} params.status - Delivery status
 * @param {string} params.retailerName - Retailer name
 * @param {string} params.driverName - Driver name (optional)
 * @param {string} params.vehicleNumber - Vehicle number (optional)
 * @returns {Promise<Object>}
 */
export async function sendDeliverySMS({ 
  to, 
  orderReference, 
  status, 
  retailerName,
  driverName = null,
  vehicleNumber = null 
}) {
  const message = getMessageForStatus(status, orderReference, retailerName, driverName, vehicleNumber)
  return await sendTermiiSMS({ to, message })
}

/**
 * Get SMS message content based on delivery status
 */
function getMessageForStatus(status, orderRef, retailerName, driverName, vehicleNumber) {
  const shortRef = orderRef.substring(0, 8)
  
  switch (status) {
    case 'confirmed':
      return `DistributionFlow: Your order #${shortRef} has been confirmed and is being prepared for delivery. We'll notify you when it's dispatched.`
    
    case 'packed':
      return `DistributionFlow: Order #${shortRef} has been packed and is ready for dispatch. Expected delivery soon.`
    
    case 'out_for_delivery':
      let dispatchMsg = `DistributionFlow: Order #${shortRef} is now out for delivery!`
      if (driverName) dispatchMsg += ` Driver: ${driverName}`
      if (vehicleNumber) dispatchMsg += ` | Vehicle: ${vehicleNumber}`
      dispatchMsg += `. Track your order at distributionflow.com/track/${shortRef}`
      return dispatchMsg
    
    case 'delivered':
      return `DistributionFlow: Order #${shortRef} has been successfully delivered to ${retailerName}. Thank you for your business!`
    
    case 'failed':
      return `DistributionFlow: Delivery attempt for order #${shortRef} was unsuccessful. Our team will contact you shortly to reschedule.`
    
    default:
      return `DistributionFlow: Order #${shortRef} status updated. Check your dashboard for details.`
  }
}

/**
 * Send bulk SMS notifications
 * @param {Array} recipients - Array of {to, orderReference, status, retailerName}
 * @returns {Promise<Object>}
 */
export async function sendBulkDeliverySMS(recipients) {
  const results = await Promise.allSettled(
    recipients.map(recipient => sendDeliverySMS(recipient))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - successful
  
  return {
    total: recipients.length,
    successful,
    failed,
    results
  }
}

/**
 * Send delivery delay warning SMS
 */
export async function sendDelayWarningSMS({ to, orderReference, hoursSinceDispatch }) {
  const message = `DistributionFlow: Order #${orderReference.substring(0, 8)} is taking longer than expected (${hoursSinceDispatch}hrs since dispatch). Our team is investigating. We apologize for the delay.`
  return await sendTermiiSMS({ to, message })
}

/**
 * Send driver dispatch notification
 * Notifies driver when they are assigned to a delivery
 */
export async function sendDriverDispatchSMS({ to, driverName, orderReference, retailerName, deliveryAddress }) {
  const shortRef = orderReference.substring(0, 8)
  const message = `Hi ${driverName}, you've been assigned to deliver Order #${shortRef} to ${retailerName} at ${deliveryAddress}. Check your app for details.`
  return await sendTermiiSMS({ to, message })
}

/**
 * Send OTP via SMS
 */
export async function sendOTPSMS({ to, otp, expiryMinutes = 10 }) {
  const message = `Your DistributionFlow verification code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`
  return await sendTermiiSMS({ to, message })
}

/**
 * Send payment receipt via SMS
 */
export async function sendPaymentReceiptSMS({ to, amount, orderReference, paymentMethod }) {
  const shortRef = orderReference.substring(0, 8)
  const message = `Payment received: ₦${amount.toLocaleString()} for Order #${shortRef} via ${paymentMethod}. Thank you!`
  return await sendTermiiSMS({ to, message })
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone) {
  // E.164 format: +[country code][number]
  // Nigeria: +234XXXXXXXXXX
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

/**
 * Format Nigerian phone number to E.164
 * Converts: 08012345678 → +2348012345678
 */
export function formatNigerianPhone(phone) {
  if (!phone) return null
  
  // Remove spaces, dashes, parentheses
  phone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Already in E.164 format
  if (phone.startsWith('+234')) return phone
  
  // Remove leading zero and add +234
  if (phone.startsWith('0')) {
    return '+234' + phone.substring(1)
  }
  
  // Add +234 if just the number
  if (phone.length === 10) {
    return '+234' + phone
  }
  
  return phone
}
