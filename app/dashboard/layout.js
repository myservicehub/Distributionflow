'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getNavigationItems } from '@/lib/permissions'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Warehouse,
  BarChart3,
  Truck,
  Activity,
  Bell
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'

// Icon mapping
const ICON_MAP = {
  LayoutDashboard,
  Store,
  Package,
  Warehouse,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Users,
  FileText,
  Settings,
  Truck,
  Activity,
  Bell
}

export default function DashboardLayout({ children }) {
  const { user, userProfile, business, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      router.push('/login')
    }
  }, [loading, user, userProfile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || !userProfile) {
    return null
  }

  // Get navigation items based on role
  const navigationItems = getNavigationItems(userProfile)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{business?.name || 'DistributionFlow'}</h2>
                <p className="text-sm text-gray-500 mt-1">{userProfile?.name}</p>
                <span className="inline-block px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded mt-2">
                  {userProfile?.role === 'admin' && 'ADMINISTRATOR'}
                  {userProfile?.role === 'manager' && 'MANAGER'}
                  {userProfile?.role === 'sales_rep' && 'SALES REP'}
                  {userProfile?.role === 'warehouse' && 'WAREHOUSE'}
                </span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation - Role-based */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = ICON_MAP[item.icon] || LayoutDashboard
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {business?.name || 'DistributionFlow'}
              </h1>
              {business?.name && (
                <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {business.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-gray-600 hidden sm:block">{userProfile?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
