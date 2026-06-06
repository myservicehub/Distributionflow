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
          <div className="flex items-center justify-between pl-16 pr-4 lg:pl-8 lg:pr-8 py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-base sm:text-xl font-semibold text-neutral-900 truncate">
                {business?.name || 'DistributionFlow'}
              </h1>
              {business?.name && (
                <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
                  {business.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationBell />
              <span className="text-sm text-neutral-600 hidden md:block">{userProfile?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
