import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Test 1: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        authError: authError?.message
      })
    }

    // Test 2: Query users table
    const { data: users, error: usersError, count } = await supabase
      .from('users')
      .select('id, role, business_id, status, auth_user_id', { count: 'exact' })
      .eq('auth_user_id', user.id)

    return NextResponse.json({
      success: true,
      authUser: {
        id: user.id,
        email: user.email
      },
      usersFound: count,
      users: users,
      error: usersError?.message
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
