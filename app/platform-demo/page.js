'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CreditCard, UserPlus, UserX, Activity } from 'lucide-react'
import Link from 'next/link'

export default function PlatformDemo() {
  // Demo data
  const kpis = {
    total_businesses: 2,
    active_businesses: 0,
    trial_businesses: 2,
    expired_businesses: 0,
    suspended_businesses: 0,
    total_active_users: 5,
    mrr: 22000,
    arr: 264000,
    arpu: 0,
    new_signups_this_month: 0,
    churn_this_month: 0
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard Demo</h1>
            <p className="text-sm text-gray-600">This is how the super admin dashboard looks</p>
          </div>
          <Link href="/login">
            <Button>Login to Access</Button>
          </Link>
        </div>
      </div>

      <div className="p-8">
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
              <div className="text-2xl font-bold">{kpis.total_businesses}</div>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.new_signups_this_month} new this month
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
              <div className="text-2xl font-bold text-green-600">{kpis.active_businesses}</div>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.trial_businesses} on trial
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
              <div className="text-2xl font-bold">{formatCurrency(kpis.mrr)}</div>
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
              <div className="text-2xl font-bold">{formatCurrency(kpis.arr)}</div>
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
              <div className="text-2xl font-bold">{kpis.total_active_users}</div>
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
              <div className="text-2xl font-bold">{formatCurrency(kpis.arpu)}</div>
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
              <div className="text-2xl font-bold text-orange-600">{kpis.trial_businesses}</div>
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
              <div className="text-2xl font-bold text-red-600">{kpis.churn_this_month}</div>
              <p className="text-xs text-gray-500 mt-1">Expired subscriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Business List */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Businesses</CardTitle>
              <CardDescription>Latest signups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Demo Business 1</div>
                    <div className="text-sm text-gray-600">demo1@example.com</div>
                  </div>
                  <Badge variant="secondary">trial</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Demo Business 2</div>
                    <div className="text-sm text-gray-600">demo2@example.com</div>
                  </div>
                  <Badge variant="secondary">trial</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>What you can do as super admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>View all businesses & metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Suspend/reactivate businesses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Reset trial periods</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Track MRR, ARR, churn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Override features per business</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Monitor business health scores</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-8 border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-indigo-900 mb-2">
                Ready to access the full platform?
              </h3>
              <p className="text-indigo-700 mb-4">
                Login with your super admin credentials to manage all businesses
              </p>
              <Link href="/login">
                <Button size="lg">
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
