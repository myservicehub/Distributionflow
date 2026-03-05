'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard from '@/components/platform/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, Users, PieChart } from 'lucide-react'

export default function RevenuePage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueAnalytics()
  }, [])

  const fetchRevenueAnalytics = async () => {
    try {
      const res = await fetch('/api/platform?route=revenue')
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const revenueByPlanData = analytics?.revenue_by_plan || {}

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
        <p className="text-gray-500 mt-2">Track and analyze platform revenue metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Monthly Recurring Revenue"
          value={`₦${(analytics?.mrr || 0).toLocaleString()}`}
          icon={DollarSign}
          subtitle="MRR"
          trend="up"
          trendValue="+8% from last month"
        />
        <KPICard
          title="Annual Recurring Revenue"
          value={`₦${(analytics?.arr || 0).toLocaleString()}`}
          icon={TrendingUp}
          subtitle="ARR (MRR × 12)"
        />
        <KPICard
          title="Average Revenue Per User"
          value={`₦${(analytics?.arpu || 0).toLocaleString()}`}
          icon={Users}
          subtitle="ARPU"
        />
        <KPICard
          title="Active Paying Businesses"
          value={analytics?.active_businesses || 0}
          icon={PieChart}
          subtitle="Contributing to MRR"
        />
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
          <CardDescription>Distribution of businesses across plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(revenueByPlanData).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue data available</p>
            ) : (
              Object.entries(revenueByPlanData).map(([planName, count]) => (
                <div key={planName} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{planName}</div>
                    <div className="text-sm text-gray-500">{count} business{count !== 1 ? 'es' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {((count / analytics.active_businesses) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">of total</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly recurring revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Revenue trend chart (implement with Recharts)</p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>Detailed revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Monthly Recurring Revenue (MRR)</td>
                <td className="py-3 px-4 text-right font-semibold">
                  ₦{(analytics?.mrr || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Annual Recurring Revenue (ARR)</td>
                <td className="py-3 px-4 text-right font-semibold">
                  ₦{(analytics?.arr || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Average Revenue Per Business (ARPU)</td>
                <td className="py-3 px-4 text-right font-semibold">
                  ₦{(analytics?.arpu || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Active Paying Businesses</td>
                <td className="py-3 px-4 text-right font-semibold">
                  {analytics?.active_businesses || 0}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4">Customer Lifetime Value (LTV) Est.</td>
                <td className="py-3 px-4 text-right font-semibold">
                  ₦{((analytics?.arpu || 0) * 24).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
