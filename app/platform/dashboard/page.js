'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard from '@/components/platform/KPICard'
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CreditCard, UserPlus, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function PlatformDashboard() {
  const [kpis, setKpis] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch KPIs
      const kpisRes = await fetch('/api/platform?route=kpis')
      const kpisData = await kpisRes.json()
      if (kpisData.success) {
        setKpis(kpisData.data)
      }

      // Fetch businesses for risk alerts
      const businessesRes = await fetch('/api/platform?route=businesses')
      const businessesData = await businessesRes.json()
      if (businessesData.success) {
        setBusinesses(businessesData.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate risk businesses
  const expiringBusinesses = businesses.filter(b => {
    if (b.subscription_status === 'trial' && b.trial_end_date) {
      const daysUntilExpiry = Math.ceil((new Date(b.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7
    }
    return false
  })

  const lowActivityBusinesses = businesses.filter(b => b.health_score && b.health_score < 50)
  const highUsageBusinesses = businesses.filter(b => b.active_users > (b.plans?.included_users || 0) * 1.5)

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500 mt-2">Monitor and manage all businesses on the platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Businesses"
          value={kpis?.total_businesses || 0}
          icon={Building2}
          subtitle={`${kpis?.active_businesses || 0} active`}
        />
        <KPICard
          title="Businesses on Trial"
          value={kpis?.trial_businesses || 0}
          icon={CreditCard}
          subtitle={`${kpis?.expired_businesses || 0} expired`}
        />
        <KPICard
          title="Total Active Users"
          value={kpis?.total_active_users || 0}
          icon={Users}
          subtitle="Across all businesses"
        />
        <KPICard
          title="Monthly Recurring Revenue"
          value={`₦${(kpis?.mrr || 0).toLocaleString()}`}
          icon={DollarSign}
          subtitle={`ARR: ₦${(kpis?.arr || 0).toLocaleString()}`}
        />
        <KPICard
          title="New Signups This Month"
          value={kpis?.new_signups_this_month || 0}
          icon={UserPlus}
          trend="up"
          trendValue="+12% from last month"
        />
        <KPICard
          title="Churn This Month"
          value={kpis?.churn_this_month || 0}
          icon={UserX}
          trend={kpis?.churn_this_month > 0 ? 'down' : 'neutral'}
          trendValue={kpis?.churn_this_month > 0 ? 'Attention needed' : 'No churn'}
        />
        <KPICard
          title="Average Revenue Per Business"
          value={`₦${(kpis?.arpu || 0).toLocaleString()}`}
          icon={TrendingUp}
          subtitle="ARPU"
        />
        <KPICard
          title="Suspended Businesses"
          value={kpis?.suspended_businesses || 0}
          icon={AlertTriangle}
          subtitle="Requires attention"
        />
      </div>

      {/* Risk Alerts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Expiring in 7 Days
            </CardTitle>
            <CardDescription>Businesses with trials ending soon</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringBusinesses.length === 0 ? (
              <p className="text-sm text-gray-500">No businesses expiring soon</p>
            ) : (
              <div className="space-y-2">
                {expiringBusinesses.slice(0, 5).map((business) => {
                  const daysLeft = Math.ceil((new Date(business.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
                  return (
                    <Link
                      key={business.id}
                      href={`/platform/businesses/${business.id}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium">{business.name}</span>
                      <Badge variant="outline" className="text-orange-600">
                        {daysLeft}d left
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Low Activity Risk
            </CardTitle>
            <CardDescription>Businesses at churn risk</CardDescription>
          </CardHeader>
          <CardContent>
            {lowActivityBusinesses.length === 0 ? (
              <p className="text-sm text-gray-500">All businesses healthy</p>
            ) : (
              <div className="space-y-2">
                {lowActivityBusinesses.slice(0, 5).map((business) => (
                  <Link
                    key={business.id}
                    href={`/platform/businesses/${business.id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">{business.name}</span>
                    <Badge variant="destructive">
                      {business.health_score}% health
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* High Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Upsell Opportunities
            </CardTitle>
            <CardDescription>High usage businesses</CardDescription>
          </CardHeader>
          <CardContent>
            {highUsageBusinesses.length === 0 ? (
              <p className="text-sm text-gray-500">No upsell opportunities</p>
            ) : (
              <div className="space-y-2">
                {highUsageBusinesses.slice(0, 5).map((business) => (
                  <Link
                    key={business.id}
                    href={`/platform/businesses/${business.id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">{business.name}</span>
                    <Badge className="bg-green-100 text-green-700">
                      {business.active_users} users
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly recurring revenue over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Chart visualization would go here (use Recharts library)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
