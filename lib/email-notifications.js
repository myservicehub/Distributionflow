import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Email template for notification alerts
 */
function createNotificationEmailHTML(notification, businessName, recipientName) {
  const typeColors = {
    payment: '#10b981',
    order: '#8b5cf6',
    inventory: '#f59e0b',
    staff: '#3b82f6',
    credit: '#eab308',
    system: '#6b7280'
  }

  const color = typeColors[notification.type] || '#6b7280'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">
                📦 DistributionFlow
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${businessName}
              </p>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${color};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                      🔔 ${notification.title}
                    </h2>
                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      ${notification.type} Alert
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Hi ${recipientName},
              </p>
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                ${notification.message}
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      <strong>Time:</strong> ${new Date(notification.created_at).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/notifications" 
                   style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View in Dashboard
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                This is an automated notification from DistributionFlow. You're receiving this because you're an administrator or manager for ${businessName}.
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} DistributionFlow. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Send email notification to a user
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.recipientName - Recipient name
 * @param {Object} params.notification - Notification object
 * @param {string} params.businessName - Business name
 * @returns {Promise<Object>}
 */
export async function sendEmailNotification({ to, recipientName, notification, businessName }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DistributionFlow <notifications@resend.dev>',
      to: [to],
      subject: `🔔 ${notification.title} - ${businessName}`,
      html: createNotificationEmailHTML(notification, businessName, recipientName)
    })

    if (error) {
      console.error('Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data.id)
    return { success: true, emailId: data.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification to all admins and managers in a business
 * @param {Object} params
 * @param {Object} params.notification - Notification object
 * @param {string} params.businessId - Business ID
 * @param {Object} params.supabaseAdmin - Supabase admin client
 * @returns {Promise<Object>}
 */
export async function sendEmailToAdminsAndManagers({ notification, businessId, supabaseAdmin }) {
  try {
    // Get business name
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    if (!business) {
      console.error('Business not found')
      return { success: false, error: 'Business not found' }
    }

    // Get all admins and managers in the business
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('email, name, role')
      .eq('business_id', businessId)
      .in('role', ['admin', 'manager'])
      .eq('is_active', true)

    if (error) throw error

    if (!users || users.length === 0) {
      console.log('No admins/managers found to notify')
      return { success: true, sent: 0 }
    }

    // Send emails to all admins and managers
    const emailPromises = users.map(user =>
      sendEmailNotification({
        to: user.email,
        recipientName: user.name,
        notification,
        businessName: business.name
      })
    )

    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    
    console.log(`Sent ${successful}/${users.length} notification emails`)
    
    return {
      success: true,
      sent: successful,
      total: users.length
    }
  } catch (error) {
    console.error('Failed to send emails to admins/managers:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Determine if a notification is critical and should trigger email
 * @param {Object} notification
 * @returns {boolean}
 */
export function isCriticalNotification(notification) {
  const criticalTypes = [
    'order', // Order cancellations, large orders
    'payment', // Large payments
    'inventory', // Low stock, large deductions
    'credit' // High credit balances
  ]

  const criticalTitles = [
    'Order Cancelled',
    'Large Payment Recorded',
    'Low Stock Alert',
    'Large Stock Deduction',
    'High Credit Balance'
  ]

  return (
    criticalTypes.includes(notification.type) ||
    criticalTitles.some(title => notification.title.includes(title))
  )
}
