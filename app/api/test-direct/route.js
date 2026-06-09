import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    console.log('=== TEST DIRECT START ===')
    const supabase = await createClient()
    
    console.log('1. Getting auth user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { userId: user?.id, error: authError?.message })
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated', authError: authError?.message }, { status: 401 })
    }

    console.log('2. Querying users table with auth_user_id...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, business_id, status, auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    
    console.log('Profile result:', { profile, error: profileError?.message })

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile query failed', 
        details: profileError,
        authUserId: user.id 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      authUser: user.id,
      profile: profile,
      message: 'Successfully retrieved profile'
    })
  } catch (error) {
    console.error('Exception:', error)
    return NextResponse.json({
      error: 'Exception occurred',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
