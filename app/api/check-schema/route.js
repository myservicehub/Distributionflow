import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Use service role to check schema
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Try to get column information by querying a single row
    const { data: sampleUser, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      columns: sampleUser ? Object.keys(sampleUser) : [],
      sampleData: sampleUser
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
