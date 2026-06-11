'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'
import SalesRepDashboard from '@/components/dashboard/SalesRepDashboard'
import WarehouseDashboard from '@/components/dashboard/WarehouseDashboard'

export default function DashboardPage() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  // Redirect drivers to their deliveries page
  useEffect(() => {
    if (!loading && userProfile?.role === 'driver') {
      router.push('/dashboard/my-deliveries')
    }
  }, [userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  // Drivers are redirected above, so they shouldn't see this
  if (userProfile.role === 'driver') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Render role-specific dashboard
  switch (userProfile.role) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'sales_rep':
      return <SalesRepDashboard />
    case 'warehouse':
      return <WarehouseDashboard />
    default:
      return (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Unknown role: {userProfile.role}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please contact your administrator for assistance.
          </p>
        </div>
      )
  }
}
