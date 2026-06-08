'use client'

import React, { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'
import Link from 'next/link'
import { formatCurrency, formatDate, getTimeAgo } from '@/lib/utils/format'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/platform?route=subscriptions')
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscriptions = statusFilter === 'all' 
    ? subscriptions 
    : subscriptions.filter(s => s.subscription_status === statusFilter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'trial': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }).format(amount || 0)
  }

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active').length,
    trial: subscriptions.filter(s => s.subscription_status === 'trial').length,
    expired: subscriptions.filter(s => s.subscription_status === 'expired').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          Subscriptions Management
        </h1>
        <p className="text-gray-600 mt-1">Monitor all business subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.trial}</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredSubscriptions.length} Subscriptions</CardTitle>
          <CardDescription>
            {statusFilter !== 'all' && `Showing ${statusFilter} subscriptions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.trial_end_date || sub.subscription_end)
                
                return (
                  <div 
                    key={sub.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{sub.name}</h3>
                        <Badge className={getStatusColor(sub.subscription_status)}>
                          {sub.subscription_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Plan:</span>
                          {sub.plan_name || 'N/A'}
                        </span>
                        
                        {sub.plan_price && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Price:</span>
                            {formatCurrency(sub.plan_price)}/month
                          </span>
                        )}
                        
                        {daysRemaining !== null && daysRemaining >= 0 && (
                          <span className={`font-medium ${
                            daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {daysRemaining === 0 
                              ? 'Expires today' 
                              : `${daysRemaining} days remaining`}
                          </span>
                        )}
                      </div>
                      
                      {sub.subscription_status === 'trial' && daysRemaining <= 7 && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Trial expiring soon</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/platform/businesses/${sub.id}`}>
                        <Button size="sm" variant="outline">
                          View Business
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
