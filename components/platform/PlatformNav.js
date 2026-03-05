'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Flag, 
  LifeBuoy, 
  Bell, 
  Settings,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function PlatformNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const navItems = [
    { name: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
    { name: 'Businesses', href: '/platform/businesses', icon: Building2 },
    { name: 'Subscriptions', href: '/platform/subscriptions', icon: CreditCard },
    { name: 'Revenue', href: '/platform/revenue', icon: DollarSign },
    { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
    { name: 'Feature Flags', href: '/platform/feature-flags', icon: Flag },
    { name: 'Support', href: '/platform/support', icon: LifeBuoy },
    { name: 'Notifications', href: '/platform/notifications', icon: Bell },
    { name: 'Settings', href: '/platform/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold">Platform Admin</div>
            <div className="text-xs text-slate-400">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
