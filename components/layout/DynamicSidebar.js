'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getNavigationItems } from '@/lib/permissions'
import {
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
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  Truck
}

export default function DynamicSidebar() {
  const pathname = usePathname()
  const { userProfile, signOut } = useAuth()

  if (!userProfile) {
    return null
  }

  const navigationItems = getNavigationItems(userProfile)

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">DistributionFlow</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {userProfile.role === 'admin' && 'Administrator'}
          {userProfile.role === 'manager' && 'Manager'}
          {userProfile.role === 'sales_rep' && 'Sales Representative'}
          {userProfile.role === 'warehouse' && 'Warehouse Staff'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border">
        <div className="mb-3">
          <p className="text-sm font-medium">{userProfile.name}</p>
          <p className="text-xs text-muted-foreground">{userProfile.email}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
