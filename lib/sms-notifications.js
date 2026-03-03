import twilio from 'twilio'

// Note: Twilio credentials should be in environment variables
// For production, get credentials from Twilio Console
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC_PLACEHOLDER'
const authToken = process.env.TWILIO_AUTH_TOKEN || 'AUTH_PLACEHOLDER'
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890'

let twilioClient = null

try {
  if (accountSid !== 'AC_PLACEHOLDER' && authToken !== 'AUTH_PLACEHOLDER') {
    twilioClient = twilio(accountSid, authToken)
  }
} catch (error) {
  console.error('Failed to initialize Twilio client:', error)
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
  // If Twilio not configured, log and return
  if (!twilioClient) {
    console.log('Twilio not configured. SMS would be sent to:', to)
    console.log('Message:', getMessageForStatus(status, orderReference, retailerName, driverName, vehicleNumber))
    return { 
      success: false, 
      error: 'Twilio not configured',
      mock: true 
    }
  }

  // Validate phone number format
  if (!to || !to.startsWith('+')) {
    console.error('Invalid phone number format. Must be E.164 format (e.g., +2348012345678)')
    return { success: false, error: 'Invalid phone number format' }
  }

  try {
    const message = getMessageForStatus(status, orderReference, retailerName, driverName, vehicleNumber)
    
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    })

    console.log('SMS sent successfully:', result.sid)
    return { 
      success: true, 
      messageSid: result.sid,
      status: result.status 
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
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
  if (!twilioClient) {
    console.log('Delay warning SMS (mock):', to, orderReference)
    return { success: false, mock: true }
  }

  try {
    const message = `DistributionFlow: Order #${orderReference.substring(0, 8)} is taking longer than expected (${hoursSinceDispatch}hrs since dispatch). Our team is investigating. We apologize for the delay.`
    
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    })

    return { success: true, messageSid: result.sid }
  } catch (error) {
    console.error('Failed to send delay warning SMS:', error)
    return { success: false, error: error.message }
  }
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
