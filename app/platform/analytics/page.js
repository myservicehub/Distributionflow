'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard from '@/components/platform/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, ShoppingCart, Users, TrendingUp, Package, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/platform?route=businesses')
      const data = await res.json()
      if (data.success) {
        setBusinesses(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const totalOrders = businesses.reduce((sum, b) => sum + (b.orders_last_30_days || 0), 0)
  const totalUsers = businesses.reduce((sum, b) => sum + (b.active_users || 0), 0)
  const totalRetailers = businesses.reduce((sum, b) => sum + (b.retailers_count || 0), 0)
  const totalProducts = businesses.reduce((sum, b) => sum + (b.products_count || 0), 0)
  const avgOrdersPerBusiness = businesses.length > 0 ? (totalOrders / businesses.length).toFixed(1) : 0
  const avgUsersPerBusiness = businesses.length > 0 ? (totalUsers / businesses.length).toFixed(1) : 0

  // Sort businesses by activity
  const mostActive = [...businesses]
    .filter(b => b.orders_last_30_days > 0)
    .sort((a, b) => (b.orders_last_30_days || 0) - (a.orders_last_30_days || 0))
    .slice(0, 10)

  const leastActive = [...businesses]
    .sort((a, b) => (a.orders_last_30_days || 0) - (b.orders_last_30_days || 0))
    .slice(0, 10)

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
        <p className="text-gray-500 mt-2">Platform-wide usage metrics and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total Orders (30 Days)"
          value={totalOrders.toLocaleString()}
          icon={ShoppingCart}
          subtitle="Across all businesses"
        />
        <KPICard
          title="Avg Orders Per Business"
          value={avgOrdersPerBusiness}
          icon={BarChart3}
          subtitle="Last 30 days"
        />
        <KPICard
          title="Total Active Users"
          value={totalUsers.toLocaleString()}
          icon={Users}
          subtitle={`Avg: ${avgUsersPerBusiness} per business`}
        />
        <KPICard
          title="Total Retailers"
          value={totalRetailers.toLocaleString()}
          icon={Building2}
          subtitle="Across platform"
        />
        <KPICard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          icon={Package}
          subtitle="In inventory"
        />
        <KPICard
          title="Active Businesses"
          value={businesses.filter(b => b.subscription_status === 'active').length}
          icon={TrendingUp}
          subtitle="With active subscriptions"
        />
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top 10 Most Active Businesses
            </CardTitle>
            <CardDescription>Based on orders in last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostActive.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No data available</p>
              ) : (
                mostActive.map((business, index) => (
                  <Link
                    key={business.id}
                    href={`/platform/businesses/${business.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-gray-500">
                          {business.active_users || 0} users
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {business.orders_last_30_days || 0}
                      </div>
                      <div className="text-xs text-gray-500">orders</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Least Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              10 Least Active Businesses
            </CardTitle>
            <CardDescription>May need attention or upsell</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leastActive.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No data available</p>
              ) : (
                leastActive.map((business, index) => (
                  <Link
                    key={business.id}
                    href={`/platform/businesses/${business.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-gray-500">
                          {business.active_users || 0} users
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        {business.orders_last_30_days || 0}
                      </div>
                      <div className="text-xs text-gray-500">orders</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Usage Breakdown</CardTitle>
          <CardDescription>Detailed statistics across all businesses</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Average per Business</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Orders (Last 30 Days)</td>
                <td className="py-3 px-4 text-right font-semibold">{totalOrders.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">{avgOrdersPerBusiness}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Active Users</td>
                <td className="py-3 px-4 text-right font-semibold">{totalUsers.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">{avgUsersPerBusiness}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Retailers</td>
                <td className="py-3 px-4 text-right font-semibold">{totalRetailers.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  {businesses.length > 0 ? (totalRetailers / businesses.length).toFixed(1) : 0}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Products</td>
                <td className="py-3 px-4 text-right font-semibold">{totalProducts.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  {businesses.length > 0 ? (totalProducts / businesses.length).toFixed(1) : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
