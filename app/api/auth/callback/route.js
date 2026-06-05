import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/welcome-email'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const supabase = createClient()
      
      // Exchange code for session
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('Auth callback error:', authError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
      }

      if (user && user.email_confirmed_at) {
        console.log('✅ Email verified for user:', user.email)

        // Check if user profile already exists (for non-email-confirmation flows or existing users)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, business_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!existingUser) {
          // NEW USER - Create business and user records from auth metadata
          console.log('🆕 New user detected, creating business and user records...')
          
          const metadata = user.user_metadata || {}
          const businessName = metadata.business_name || 'My Business'
          const fullName = metadata.full_name || user.email?.split('@')[0] || 'User'
          const address = metadata.address || ''
          const planId = metadata.plan_id || 'business'

          try {
            // STEP 1: Create business record
            const { data: businessData, error: businessError } = await supabase
              .from('businesses')
              .insert({
                name: businessName,
                address: address,
                owner_id: user.id
              })
              .select()
              .single()

            if (businessError) {
              console.error('❌ Business creation error:', businessError)
              throw new Error(`Failed to create business: ${businessError.message}`)
            }

            console.log('✅ Business created:', businessData.id)

            // STEP 2: Update business with subscription fields (trial period)
            try {
              const trialEndDate = new Date()
              trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

              // Find the plan in database (match plan name from metadata)
              const planMap = {
                'starter': 'Starter',
                'business': 'Business',
                'enterprise': 'Enterprise'
              }
              const planName = planMap[planId] || 'Business'

              const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .ilike('name', planName)
                .single()

              if (planData) {
                await supabase
                  .from('businesses')
                  .update({
                    plan_id: planData.id,
                    subscription_status: 'trial',
                    trial_end_date: trialEndDate.toISOString(),
                    status: 'active'
                  })
                  .eq('id', businessData.id)
                
                console.log('✅ Business subscription configured (14-day trial)')
              }
            } catch (subscriptionError) {
              console.log('⚠️ Note: Subscription fields not available. Skipping trial setup.')
            }

            // STEP 3: Create user profile with admin role
            const { data: userProfileData, error: userError } = await supabase
              .from('users')
              .insert({
                business_id: businessData.id,
                auth_user_id: user.id,
                name: fullName,
                email: user.email,
                role: 'admin',
                is_active: true,
                status: 'active'
              })
              .select()
              .single()

            if (userError) {
              console.error('❌ User profile creation error:', userError)
              throw new Error(`Failed to create user profile: ${userError.message}`)
            }

            console.log('✅ User profile created:', userProfileData.id)

            // STEP 4: Send welcome email
            console.log('📧 Sending welcome email to:', user.email)
            
            const emailResult = await sendWelcomeEmail({
              email: user.email,
              name: fullName,
              businessName: businessName
            })

            if (emailResult.success) {
              console.log('✅ Welcome email sent successfully')
            } else {
              console.error('❌ Welcome email failed:', emailResult.error)
            }

          } catch (dbError) {
            console.error('❌ Database insertion failed:', dbError)
            // If DB insertion fails, we should clean up the auth user or show error
            return NextResponse.redirect(`${requestUrl.origin}/login?error=account_setup_failed&message=${encodeURIComponent(dbError.message)}`)
          }
        } else {
          // EXISTING USER - Just send welcome email if needed
          console.log('👤 Existing user logging in:', user.email)
          
          // Optionally fetch their data for welcome email
          const { data: userData } = await supabase
            .from('users')
            .select(`
              id,
              name,
              email,
              businesses (
                name
              )
            `)
            .eq('auth_user_id', user.id)
            .single()

          if (userData) {
            console.log('📧 Sending welcome email to returning user:', userData.email)
            
            const emailResult = await sendWelcomeEmail({
              email: userData.email,
              name: userData.name,
              businessName: userData.businesses?.name || 'Your Business'
            })

            if (emailResult.success) {
              console.log('✅ Welcome email sent')
            }
          }
        }
      }

      // Redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_error`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
