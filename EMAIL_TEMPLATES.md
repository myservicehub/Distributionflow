## 📧 Email Templates for Supabase - Updated with Welcome Email

---

## Template 1: Email Verification (Signup Confirmation)

**Purpose**: Verify email address during signup  
**When sent**: Immediately after user signs up  
**Supabase Template**: "Confirm signup"

### Subject:
```
Verify Your Email - Welcome to DistributionFlow
```

### HTML Body:
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
                                🎉 Almost There!
                            </h1>
                            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                                Just one more step to get started
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Please Verify Your Email
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thanks for signing up for <strong>DistributionFlow</strong>! We're excited to help you streamline your empty bottle tracking, credit management, and distribution operations.
                            </p>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                To complete your registration and start your <strong>14-day free trial</strong>, please verify your email address by clicking the button below:
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
                                After verification, you'll be able to:
                            </h3>
                            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                <li>✅ Track empty bottles automatically on every delivery</li>
                                <li>📊 Manage credit limits and payment terms</li>
                                <li>🚚 Process orders and track deliveries</li>
                                <li>📈 Generate detailed reports and analytics</li>
                                <li>⏰ Enjoy 14 days of full access - FREE!</li>
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

## Template 2: Welcome Email (After Verification)

**Purpose**: Welcome user and guide them to get started  
**When sent**: After email is verified (automatically via webhook)  
**Implementation**: We'll add this as a custom function

### Subject:
```
Welcome to DistributionFlow! 🎉 Let's Get Started
```

### HTML Body:
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
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                                🎉 Welcome Aboard!
                            </h1>
                            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 18px;">
                                Your account is ready to go
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                Hi {{ .User.UserMetaData.full_name }}! 👋
                            </h2>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for choosing <strong>DistributionFlow</strong>! Your email has been verified and your <strong>14-day free trial</strong> has started.
                            </p>
                            
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                We're here to help you save time, reduce losses, and grow your distribution business. Let's get you started!
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="https://distributionflow.netlify.app/dashboard" 
                                           style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Go to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Getting Started Steps -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
                                🚀 Get Started in 3 Easy Steps
                            </h3>
                            
                            <!-- Step 1 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50" valign="top">
                                                    <div style="background-color: #3b82f6; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; text-align: center; line-height: 40px;">
                                                        1
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">
                                                        Add Your Products
                                                    </h4>
                                                    <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                                                        Set up your product catalog and link each product to its empty bottle type for automatic tracking.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Step 2 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50" valign="top">
                                                    <div style="background-color: #3b82f6; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; text-align: center; line-height: 40px;">
                                                        2
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">
                                                        Add Your Retailers
                                                    </h4>
                                                    <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                                                        Import your retailer list and set credit limits & payment terms for each customer.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Step 3 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="background-color: #dbeafe; border-radius: 8px; padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50" valign="top">
                                                    <div style="background-color: #3b82f6; color: #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; text-align: center; line-height: 40px;">
                                                        3
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">
                                                        Create Your First Order
                                                    </h4>
                                                    <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                                                        Process orders and deliveries - empty bottles will be tracked automatically!
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Features Highlight -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; background-color: #f9fafb;">
                            <h3 style="color: #1f2937; margin: 20px 0 15px 0; font-size: 18px; text-align: center;">
                                What You Can Do with DistributionFlow
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50%" style="padding: 10px;">
                                        <div style="text-align: center;">
                                            <span style="font-size: 32px;">🍾</span>
                                            <p style="color: #4b5563; font-size: 13px; margin: 5px 0 0 0; line-height: 1.4;">
                                                <strong>Automatic Empty Tracking</strong><br>
                                                Track every empty bottle on delivery
                                            </p>
                                        </div>
                                    </td>
                                    <td width="50%" style="padding: 10px;">
                                        <div style="text-align: center;">
                                            <span style="font-size: 32px;">💰</span>
                                            <p style="color: #4b5563; font-size: 13px; margin: 5px 0 0 0; line-height: 1.4;">
                                                <strong>Credit Management</strong><br>
                                                Set limits & track payments
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="padding: 10px;">
                                        <div style="text-align: center;">
                                            <span style="font-size: 32px;">📦</span>
                                            <p style="color: #4b5563; font-size: 13px; margin: 5px 0 0 0; line-height: 1.4;">
                                                <strong>Order Processing</strong><br>
                                                From order to delivery in one system
                                            </p>
                                        </div>
                                    </td>
                                    <td width="50%" style="padding: 10px;">
                                        <div style="text-align: center;">
                                            <span style="font-size: 32px;">📊</span>
                                            <p style="color: #4b5563; font-size: 13px; margin: 5px 0 0 0; line-height: 1.4;">
                                                <strong>Detailed Reports</strong><br>
                                                Sales, empties, debt aging & more
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Help Section -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center;">
                                <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                                    Need Help Getting Started?
                                </h4>
                                <p style="color: #4b5563; font-size: 14px; margin: 0 0 15px 0; line-height: 1.5;">
                                    Our support team is here to help you succeed!
                                </p>
                                <a href="mailto:support@distributionflow.com" 
                                   style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                                    Contact Support
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Email us at <a href="mailto:support@distributionflow.com" style="color: #3b82f6; text-decoration: none;">support@distributionflow.com</a>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                                Your 14-day trial started today. No credit card required.
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

## 🔧 Implementation Instructions

### Step 1: Add Verification Email Template to Supabase

1. Go to **Supabase Dashboard**
2. **Authentication → Email Templates**
3. Select **"Confirm signup"**
4. Copy the **Template 1** HTML above
5. Paste and **Save**

---

### Step 2: Set Up Welcome Email (Automatic)

We'll use Supabase webhooks to send welcome email after verification.

**Option A: Using Supabase Edge Function (Recommended)**

Create an edge function that listens for `user.confirmed` event and sends welcome email.

**Option B: Manual Implementation**

Add welcome email sending in your app after successful verification.

---

## 📧 Email Flow

**User Journey:**

```
1. User signs up
   ↓
2. Email #1 sent: "Verify Your Email" (with link)
   ↓
3. User clicks verification link
   ↓
4. Email verified ✅
   ↓
5. Email #2 sent: "Welcome to DistributionFlow!" (getting started guide)
   ↓
6. User redirected to dashboard
```

---

## ✅ What Each Email Does

### Verification Email:
- ✅ Confirms email address is valid
- ✅ Activates user account
- ✅ Provides verification link
- ✅ Expires in 24 hours

### Welcome Email:
- ✅ Confirms successful registration
- ✅ Guides user to get started
- ✅ Explains key features
- ✅ Provides support contact
- ✅ Builds excitement!

---

## 🎨 Customization

**Change these in the templates:**

1. **Company Name**: "DistributionFlow"
2. **Support Email**: support@distributionflow.com
3. **Colors**: Adjust hex codes in styles
4. **Trial Duration**: "14-day free trial"
5. **Dashboard URL**: https://distributionflow.netlify.app/dashboard

---

**Both templates are ready to use!** 🎉
