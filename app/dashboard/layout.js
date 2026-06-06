'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DynamicSidebar from '@/components/layout/DynamicSidebar'
import NotificationBell from '@/components/notifications/NotificationBell'

export default function DashboardLayout({ children }) {
  const { user, userProfile, business, loading } = useAuth()
  const router = useRouter()

  // Handle redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      router.push('/login')
    }
  }, [loading, user, userProfile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      {/* New Collapsible Sidebar */}
      <DynamicSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-soft">
          <div className="flex items-center gap-3 px-4 lg:px-8 py-4">
            {/* Mobile Menu Button - Inside header */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
              className="lg:hidden p-2 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Business Name */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-neutral-900 truncate">
                {business?.name || 'DistributionFlow'}
              </h1>
              {business?.name && (
                <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full flex-shrink-0">
                  {business.name}
                </span>
              )}
            </div>

            {/* Right side items */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <NotificationBell />
              <span className="text-sm text-neutral-600 hidden md:block">{userProfile?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
