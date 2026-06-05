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

        // Fetch user's business and profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            business_id,
            businesses (
              id,
              name,
              plan_id,
              plans (
                name,
                price
              )
            )
          `)
          .eq('auth_user_id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
        } else if (userData) {
          // Send welcome email
          console.log('📧 Sending welcome email to:', userData.email)
          
          const emailResult = await sendWelcomeEmail({
            email: userData.email,
            name: userData.name,
            businessName: userData.businesses?.name || 'Your Business'
          })

          if (emailResult.success) {
            console.log('✅ Welcome email sent successfully to:', userData.email)
          } else {
            console.error('❌ Welcome email failed:', emailResult.error)
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
