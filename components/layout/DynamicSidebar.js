'use client'

import { useState } from 'react'
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
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (!userProfile) {
    return null
  }

  const navigationItems = getNavigationItems(userProfile)

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={toggleMobile}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-medium border border-neutral-200 hover:bg-neutral-50 transition-colors"
    >
      {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  )

  // Sidebar Content
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className={`border-b border-neutral-200 transition-all duration-300 ${
        isCollapsed ? 'p-4' : 'p-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className={`transition-all duration-300 ${
            isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
          }`}>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap">
              DistributionFlow
            </h1>
            <p className="text-sm text-neutral-600 mt-1 whitespace-nowrap">
              {userProfile.role === 'admin' && 'Administrator'}
              {userProfile.role === 'manager' && 'Manager'}
              {userProfile.role === 'sales_rep' && 'Sales Representative'}
              {userProfile.role === 'warehouse' && 'Warehouse Staff'}
            </p>
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {isCollapsed ? 
              <ChevronRight className="h-5 w-5 text-neutral-600" /> : 
              <ChevronLeft className="h-5 w-5 text-neutral-600" />
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-primary text-white shadow-glow-primary'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  } ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-neutral-600 group-hover:text-primary-600'
                  }`} />
                  <span className={`font-medium transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className={`border-t border-neutral-200 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        {!isCollapsed && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-neutral-900 truncate">{userProfile.name}</p>
            <p className="text-xs text-neutral-600 truncate">{userProfile.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          className={`w-full border-neutral-300 hover:bg-neutral-100 transition-colors ${
            isCollapsed ? 'px-2' : ''
          }`}
          onClick={signOut}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className="h-4 w-4" />
          <span className={`ml-2 transition-all duration-300 ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            Sign Out
          </span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-strong transform transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block sticky top-0 h-screen border-r border-neutral-200 transition-all duration-300 shadow-soft ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <SidebarContent />
      </aside>
    </>
  )
}
