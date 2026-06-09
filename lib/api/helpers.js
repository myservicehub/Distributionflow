import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Create Supabase client with server-side auth
 */
export function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Get authenticated user and their business context
 * Returns { userId, businessId, role } or null if unauthorized
 */
export async function getUserBusinessId(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.log('Auth error:', error?.message || 'No user')
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, business_id, role, status')
    .eq('auth_user_id', user.id)  // FIX: Query by auth_user_id, not id
    .maybeSingle()

  if (profileError || !profile?.business_id) {
    console.log('Profile error:', profileError?.message || 'No business')
    return null
  }

  if (profile.status !== 'active') {
    console.log('Profile error: User is not active')
    return null
  }

  return {
    userId: profile.id,  // Return the users table ID
    businessId: profile.business_id,
    role: profile.role
  }
}

/**
 * Add CORS headers to response
 */
export function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/**
 * Extract and validate pagination parameters from request URL
 * Returns { page, pageSize, from, to } for Supabase range queries
 */
export function getPaginationParams(request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)))
  
  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1
  }
}

/**
 * Build pagination metadata for responses
 */
export function buildPaginationResponse(data, totalCount, pagination) {
  return {
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize)
    }
  }
}

/**
 * Standard error response helper
 */
export function errorResponse(message, status = 400, details = null) {
  return handleCORS(NextResponse.json({
    error: message,
    ...(details && { details })
  }, { status }))
}

/**
 * Standard success response helper
 */
export function successResponse(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }))
}
