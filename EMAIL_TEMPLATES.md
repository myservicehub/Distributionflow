# Email Templates for Supabase

Copy these templates to your Supabase Dashboard → Authentication → Email Templates

---

## 1. Confirm Signup Template

**Subject:** Welcome to DistributionFlow - Please Verify Your Email

**Body (HTML):**

```html
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
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                Welcome to DistributionFlow!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Hi there! 👋
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thanks for signing up for DistributionFlow! We're excited to help you manage your empty bottles, track credit, and grow your distribution business.
                            </p>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Please verify your email address by clicking the button below:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           style="background-color: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                                {{ .ConfirmationURL }}
                            </p>
                            
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0 0 0; border-radius: 4px;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                                    ⏱️ <strong>This link expires in 24 hours.</strong> If you didn't sign up for DistributionFlow, you can safely ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- What's Next -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                                What's next?
                            </h3>
                            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                <li>Complete your business profile</li>
                                <li>Add your products and retailers</li>
                                <li>Start tracking empty bottles automatically</li>
                                <li>Enjoy your 14-day free trial!</li>
                            </ul>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:support@distributionflow.com" style="color: #3b82f6; text-decoration: none;">support@distributionflow.com</a>
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
```

---

## 2. Reset Password Template

**Subject:** Reset Your DistributionFlow Password

**Body (HTML):**

```html
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
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                Password Reset Request
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Reset Your Password
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                We received a request to reset your DistributionFlow password.
                            </p>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Click the button below to create a new password:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           style="background-color: #ef4444; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                                {{ .ConfirmationURL }}
                            </p>
                            
                            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 30px 0 0 0; border-radius: 4px;">
                                <p style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
                                    ⏱️ <strong>This link expires in 1 hour.</strong>
                                </p>
                                <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
                                    🔒 If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Security Tips -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                                Security Tips
                            </h3>
                            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                <li>Use a strong, unique password</li>
                                <li>Don't share your password with anyone</li>
                                <li>Enable two-factor authentication if available</li>
                                <li>Contact us if you notice suspicious activity</li>
                            </ul>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:support@distributionflow.com" style="color: #3b82f6; text-decoration: none;">support@distributionflow.com</a>
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
```

---

## 3. Magic Link Template

**Subject:** Your DistributionFlow Login Link

**Body (HTML):**

```html
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
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                Your Login Link
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Sign in to DistributionFlow
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Click the button below to securely sign in to your account:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Sign In Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                                {{ .ConfirmationURL }}
                            </p>
                            
                            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 30px 0 0 0; border-radius: 4px;">
                                <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                                    ℹ️ If you didn't request this login link, you can safely ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:support@distributionflow.com" style="color: #3b82f6; text-decoration: none;">support@distributionflow.com</a>
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
```

---

## How to Apply These Templates

### In Supabase Dashboard:

1. Go to **Authentication → Email Templates**
2. Select each template type (Confirm signup, Reset password, Magic link)
3. Replace the default template with the HTML above
4. Click **Save**

### Tips:

- Test emails by signing up with your own email
- Check both desktop and mobile email clients
- Customize colors to match your brand
- Update support email address
- Add your logo (optional)

### Variables Available:

- `{{ .ConfirmationURL }}` - The verification/action link
- `{{ .Token }}` - The verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

---

**Your email templates are now professional and branded!** 🎨
