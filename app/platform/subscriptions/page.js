'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter])

  const fetchSubscriptions = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/platform?route=subscriptions'
        : `/api/platform?route=subscriptions&status=${statusFilter}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.data)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      cancelled: 'outline',
      expired: 'destructive',
      failed: 'destructive'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500 mt-2">Monitor all active and past subscriptions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'cancelled', 'expired'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>Complete subscription records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Business</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Base Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Extra Users</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cycle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Next Billing</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Link 
                          href={`/platform/businesses/${sub.business_id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {sub.businesses?.name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        {sub.plans?.display_name || 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        ₦{sub.base_price?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div>{sub.extra_users || 0} users</div>
                          <div className="text-gray-500">
                            ₦{((sub.extra_users || 0) * (sub.price_per_extra_user || 0)).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        ₦{sub.total_amount?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 px-4 capitalize">
                        {sub.billing_cycle}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {sub.next_billing_date 
                          ? new Date(sub.next_billing_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
