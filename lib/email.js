// Email utility using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const { data, error } = await resend.emails.send({
      from: 'DistributionFlow <distributionflow01@gmail.com>',
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
    const { data, error } = await resend.emails.send({
      from: 'DistributionFlow <distributionflow01@gmail.com>',
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
