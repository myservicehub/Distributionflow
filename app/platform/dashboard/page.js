'use client'

import React, { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CreditCard, UserPlus, UserX, Activity } from 'lucide-react'
import Link from 'next/link'

export default function PlatformDashboard() {
  const [kpis, setKpis] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch KPIs
      const kpisRes = await fetch('/api/platform?route=kpis')
      if (!kpisRes.ok) throw new Error('Failed to fetch KPIs')
      const kpisData = await kpisRes.json()
      
      if (kpisData.success) {
        setKpis(kpisData.data)
      } else {
        setError(kpisData.error)
      }

      // Fetch businesses
      const businessesRes = await fetch('/api/platform?route=businesses')
      if (!businessesRes.ok) throw new Error('Failed to fetch businesses')
      const businessesData = await businessesRes.json()
      
      if (businessesData.success) {
        setBusinesses(businessesData.data)
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate risk businesses
  const atRiskBusinesses = businesses.filter(b => {
    if (b.subscription_status === 'trial' && b.trial_end_date) {
      const daysLeft = Math.ceil((new Date(b.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 7
    }
    return b.health_score < 50
  })

  const lowHealthBusinesses = businesses.filter(b => b.health_score < 70).slice(0, 5)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your super admin control center</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Businesses
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_businesses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis?.new_signups_this_month || 0} new this month
            </p>
          </CardContent>
        </Card>

        {/* Active Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Businesses
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis?.active_businesses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis?.trial_businesses || 0} on trial
            </p>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Recurring Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.mrr || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">MRR</p>
          </CardContent>
        </Card>

        {/* ARR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Annual Recurring Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.arr || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">ARR</p>
          </CardContent>
        </Card>

        {/* Total Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_active_users || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Across all businesses</p>
          </CardContent>
        </Card>

        {/* ARPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ARPU
            </CardTitle>
            <CreditCard className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.arpu || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
          </CardContent>
        </Card>

        {/* Trial Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trial Businesses
            </CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis?.trial_businesses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Currently on trial</p>
          </CardContent>
        </Card>

        {/* Churn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Churn This Month
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis?.churn_this_month || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Expired subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {atRiskBusinesses.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Businesses At Risk</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              {atRiskBusinesses.length} businesses need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskBusinesses.slice(0, 5).map((business) => {
                const daysLeft = business.trial_end_date 
                  ? Math.ceil((new Date(business.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <div key={business.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{business.name}</div>
                      <div className="text-sm text-gray-600">{business.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {daysLeft !== null && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Trial ends in {daysLeft} days
                        </Badge>
                      )}
                      {business.health_score < 50 && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                          Health: {business.health_score}%
                        </Badge>
                      )}
                      <Link href={`/platform/businesses/${business.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
            {atRiskBusinesses.length > 5 && (
              <Link href="/platform/businesses?filter=at-risk">
                <Button variant="link" className="mt-4">
                  View all {atRiskBusinesses.length} at-risk businesses →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Businesses & Health Scores */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Businesses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Businesses</CardTitle>
            <CardDescription>Latest signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businesses.slice(0, 5).map((business) => (
                <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{business.name}</div>
                    <div className="text-sm text-gray-600">{business.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      business.subscription_status === 'active' ? 'default' :
                      business.subscription_status === 'trial' ? 'secondary' :
                      'outline'
                    }>
                      {business.subscription_status}
                    </Badge>
                    <Link href={`/platform/businesses/${business.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/platform/businesses">
              <Button variant="link" className="mt-4">View all businesses →</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Low Health Businesses */}
        <Card>
          <CardHeader>
            <CardTitle>Health Monitoring</CardTitle>
            <CardDescription>Businesses with low health scores</CardDescription>
          </CardHeader>
          <CardContent>
            {lowHealthBusinesses.length > 0 ? (
              <div className="space-y-3">
                {lowHealthBusinesses.map((business) => (
                  <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{business.name}</div>
                      <div className="text-sm text-gray-600">
                        Health Score: {business.health_score || 0}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            business.health_score >= 70 ? 'bg-green-500' :
                            business.health_score >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${business.health_score}%` }}
                        />
                      </div>
                      <Link href={`/platform/businesses/${business.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>All businesses are healthy! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
