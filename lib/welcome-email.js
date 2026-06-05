// lib/welcome-email.js
// Function to send welcome email after user verification

import { Resend } from 'resend'

/**
 * Send welcome email to newly verified user
 * Call this after email verification is complete
 */
export async function sendWelcomeEmail({ email, name, businessName }) {
  try {
    // Initialize Resend inside the function
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const welcomeEmailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                                🎉 Welcome Aboard!
                            </h1>
                            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 18px;">
                                Your account is ready to go
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for choosing <strong>DistributionFlow</strong>! Your email has been verified and your <strong>14-day free trial</strong> has started for <strong>${businessName}</strong>.
                            </p>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                We're here to help you save time, reduce losses, and grow your distribution business. Let's get you started!
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
                                           style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Go to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                                🚀 Get Started in 3 Easy Steps
                            </h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <p style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                                            1. Add Your Products
                                        </p>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">
                                            Set up your product catalog and link each product to its empty bottle type.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <p style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                                            2. Add Your Retailers
                                        </p>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">
                                            Import your retailer list and set credit limits & payment terms.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <p style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                                            3. Create Your First Order
                                        </p>
                                        <p style="color: #4b5563; margin: 0; font-size: 14px;">
                                            Process orders - empty bottles will be tracked automatically!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center;">
                                <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                                    Need Help Getting Started?
                                </h4>
                                <p style="color: #4b5563; font-size: 14px; margin: 0 0 15px 0;">
                                    Our support team is here to help you succeed!
                                </p>
                                <a href="mailto:support@distributionflow.com" 
                                   style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                                    Contact Support
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Email us at <a href="mailto:support@distributionflow.com" style="color: #3b82f6; text-decoration: none;">support@distributionflow.com</a>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2024 DistributionFlow. All rights reserved.
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

    const { data, error } = await resend.emails.send({
      from: `DistributionFlow <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to DistributionFlow! 🎉 Let\'s Get Started',
      html: welcomeEmailHTML,
    })

    if (error) {
      console.error('Welcome email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Welcome email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: error.message }
  }
}
