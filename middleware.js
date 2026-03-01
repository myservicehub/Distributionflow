import { updateSession } from './lib/supabase/middleware'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  // Update session
  let response = await updateSession(request)

  // Check if user needs to change password
  const { pathname } = request.nextUrl

  // Skip password check for these paths
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/change-password']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response
  }

  // Check if user is logged in and needs password change
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user && user.user_metadata?.needs_password_change === true) {
      // Redirect to change password page
      return NextResponse.redirect(new URL('/change-password', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
