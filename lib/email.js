// Email utility using Resend
import { Resend } from 'resend'

/**
 * Send staff invitation email
 */
export async function sendStaffInvitation({
  to,
  staffName,
  businessName,
  role,
  tempPassword,
  loginUrl
}) {
  try {
    // Initialize Resend inside the function to avoid build-time errors
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const { data, error } = await resend.emails.send({
      from: `DistributionFlow <${process.env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: `Welcome to ${businessName} - Your Account is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .credentials { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
              .password { font-family: monospace; font-size: 16px; font-weight: bold; color: #1f2937; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to DistributionFlow!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${staffName}</strong>,</p>
                <p>You've been added to <strong>${businessName}</strong>'s DistributionFlow account as a <strong>${role.replace('_', ' ').toUpperCase()}</strong>.</p>
                
                <div class="credentials">
                  <h3>Your Login Credentials:</h3>
                  <p><strong>Email:</strong> ${to}</p>
                  <p><strong>Temporary Password:</strong> <span class="password">${tempPassword}</span></p>
                </div>

                <p><strong>⚠️ Important:</strong> You'll be required to change your password when you first log in.</p>

                <a href="${loginUrl}" class="button">Login to Your Account</a>

                <p>If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${loginUrl}">${loginUrl}</a></p>

                <p>Welcome aboard!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from DistributionFlow. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email exception:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset({
  to,
  staffName,
  resetUrl
}) {
  try {
    // Initialize Resend inside the function to avoid build-time errors
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const { data, error } = await resend.emails.send({
      from: `DistributionFlow <${process.env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: 'Reset Your Password - DistributionFlow',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
              .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${staffName}</strong>,</p>
                <p>We received a request to reset your password for your DistributionFlow account.</p>
                
                <a href="${resetUrl}" class="button">Reset Your Password</a>

                <p>If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}">${resetUrl}</a></p>

                <div class="warning">
                  <p><strong>⚠️ Security Note:</strong></p>
                  <p>• This link will expire in 1 hour</p>
                  <p>• If you didn't request this, please ignore this email</p>
                  <p>• Your password won't change until you create a new one</p>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated email from DistributionFlow. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email exception:', error)
    throw error
  }
}


/**
 * Send invoice receipt email after payment
 */
export async function sendInvoiceReceipt({
  to,
  businessName,
  invoiceNumber,
  amount,
  planName,
  billingPeriodStart,
  billingPeriodEnd,
  invoiceId
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)

    const { data, error } = await resend.emails.send({
      from: `DistributionFlow <${process.env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: `Payment Receipt - Invoice ${invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
              }
              .header h1 { 
                margin: 0; 
                font-size: 28px;
                font-weight: 600;
              }
              .header p { 
                margin: 10px 0 0 0; 
                opacity: 0.9;
                font-size: 16px;
              }
              .content { 
                padding: 40px 30px; 
              }
              .success-badge {
                background: #d1fae5;
                color: #065f46;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 20px;
              }
              .invoice-details { 
                background: #f9fafb; 
                padding: 25px; 
                border-radius: 8px;
                border-left: 4px solid #059669;
                margin: 25px 0;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                color: #6b7280;
                font-size: 14px;
              }
              .detail-value {
                font-weight: 600;
                color: #111827;
              }
              .total-amount {
                background: #059669;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 25px 0;
              }
              .total-amount .label {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 5px;
              }
              .total-amount .amount {
                font-size: 32px;
                font-weight: bold;
              }
              .button { 
                display: inline-block; 
                background: #059669; 
                color: white; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
                font-weight: 600;
              }
              .button:hover {
                background: #047857;
              }
              .footer { 
                background: #f9fafb;
                text-align: center; 
                padding: 30px 20px; 
                font-size: 13px; 
                color: #6b7280; 
                border-top: 1px solid #e5e7eb;
              }
              .footer a {
                color: #059669;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>Payment Received</h1>
                <p>Thank you for your payment!</p>
              </div>
              
              <div class="content">
                <span class="success-badge">✓ PAYMENT SUCCESSFUL</span>
                
                <p>Hi <strong>${businessName}</strong>,</p>
                
                <p>We've received your payment successfully. Here are the details of your transaction:</p>
                
                <div class="invoice-details">
                  <div class="detail-row">
                    <span class="detail-label">Invoice Number</span>
                    <span class="detail-value">${invoiceNumber}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Subscription Plan</span>
                    <span class="detail-value">${planName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Billing Period</span>
                    <span class="detail-value">${new Date(billingPeriodStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(billingPeriodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Payment Date</span>
                    <span class="detail-value">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div class="total-amount">
                  <div class="label">Amount Paid</div>
                  <div class="amount">${formattedAmount}</div>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/subscriptions?route=view-invoice&invoice_id=${invoiceId}" class="button">
                    View Full Invoice
                  </a>
                </p>

                <p style="margin-top: 30px;">Your subscription is now active and you have full access to all features.</p>

                <p>If you have any questions about your payment or subscription, please don't hesitate to contact us.</p>
              </div>

              <div class="footer">
                <p><strong>DistributionFlow</strong></p>
                <p>Managing your distribution business, simplified.</p>
                <p style="margin-top: 15px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing">View Billing</a> • 
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Get Support</a>
                </p>
                <p style="margin-top: 15px; font-size: 11px;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending invoice receipt email:', error)
      throw error
    }

    console.log('Invoice receipt email sent successfully:', invoiceNumber)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send invoice receipt email:', error)
    // Don't throw - we don't want email failures to break payment processing
    return { success: false, error: error.message }
  }
}
