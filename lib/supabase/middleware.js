import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ============================================
  // SUPER ADMIN PLATFORM PROTECTION
  // ============================================
  if (pathname.startsWith('/platform')) {
    if (!user) {
      // Not authenticated, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user is super admin
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: adminData } = await adminClient
      .from('platform_admins')
      .select('id, role, status')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!adminData || adminData.role !== 'super_admin') {
      // Not a super admin, redirect to regular dashboard or 403
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Super admin verified, allow access
    return supabaseResponse
  }

  // Public pages that don't require authentication
  const publicPages = [
    '/',
    '/pricing',
    '/view-pricing',
    '/about',
    '/contact',
    '/support',
    '/privacy',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/accept-invite',
    '/api/cron/check-subscriptions',
    '/api/webhooks/paystack'
  ]
  
  const isPublicPage = publicPages.some(page => 
    request.nextUrl.pathname === page || request.nextUrl.pathname.startsWith(page + '/')
  )
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password') ||
                     request.nextUrl.pathname.startsWith('/accept-invite')
  
  const isProtectedRoute = !isPublicPage

  if (!user && isProtectedRoute) {
    // Redirect to login if accessing protected route without auth
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // Redirect to dashboard if already logged in
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
