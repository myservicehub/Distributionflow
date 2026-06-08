'use client'

import React, { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard } from 'lucide-react'

export default function RevenuePage() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPIs()
  }, [])

  const fetchKPIs = async () => {
    try {
      const res = await fetch('/api/platform?route=kpis')
      const data = await res.json()
      if (data.success) {
        setKpis(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="h-8 w-8" />
          Revenue Analytics
        </h1>
        <p className="text-gray-600 mt-1">Track your platform's financial performance</p>
      </div>

      {/* Main Revenue Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* MRR */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-emerald-800">
              Monthly Recurring Revenue (MRR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(kpis?.mrr || 0)}
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm text-emerald-700 mt-2">
              From {kpis?.active_businesses || 0} active businesses
            </p>
          </CardContent>
        </Card>

        {/* ARR */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-purple-800">
              Annual Recurring Revenue (ARR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(kpis?.arr || 0)}
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 mt-2">
              MRR × 12 months
            </p>
          </CardContent>
        </Card>

        {/* ARPU */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-800">
              Average Revenue Per User (ARPU)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(kpis?.arpu || 0)}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Per business per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_businesses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">
              Active (Paying)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis?.active_businesses || 0}
            </div>
            <p className="text-xs text-green-700 mt-1">
              {kpis?.active_businesses > 0 
                ? `${Math.round((kpis.active_businesses / kpis.total_businesses) * 100)}% of total`
                : 'No active businesses'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">
              On Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {kpis?.trial_businesses || 0}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Potential customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800">
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpis?.new_signups_this_month || 0}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Signups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Churn & Retention */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Churn Analysis</CardTitle>
            <CardDescription>Businesses lost this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {kpis?.churn_this_month || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Churned businesses</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            
            {kpis?.total_businesses > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Churn Rate:</span>
                  <span className="font-medium">
                    {((kpis.churn_this_month / kpis.total_businesses) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Retention Rate:</span>
                  <span className="font-medium text-green-600">
                    {(100 - (kpis.churn_this_month / kpis.total_businesses) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Total active users across platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-indigo-600">
                  {kpis?.total_active_users || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Active users</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            
            {kpis?.active_businesses > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Users per Business:</span>
                  <span className="font-medium">
                    {Math.round(kpis.total_active_users / kpis.active_businesses)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
          <CardDescription>Current period overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis?.mrr || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">From Active Businesses</p>
                <p className="text-lg font-semibold">{kpis?.active_businesses || 0} businesses</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Projected ARR</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis?.arr || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">If MRR Maintains</p>
                <p className="text-lg font-semibold">Next 12 months</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Average ARPU</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis?.arpu || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Per Business/Month</p>
                <p className="text-lg font-semibold">Revenue efficiency</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
