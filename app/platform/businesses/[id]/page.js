'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Ban, CheckCircle, RotateCcw, Users, CreditCard, Calendar, Activity } from 'lucide-react'
import Link from 'next/link'

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchBusinessDetail()
    }
  }, [params.id])

  const fetchBusinessDetail = async () => {
    try {
      const res = await fetch(`/api/platform?route=business-detail&id=${params.id}`)
      const data = await res.json()
      if (data.success) {
        setBusiness(data.data)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspension')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'suspend-business',
          businessId: params.id,
          reason: suspendReason
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('Business suspended successfully')
        fetchBusinessDetail()
        setSuspendDialog(false)
        setSuspendReason('')
      } else {
        alert('Failed to suspend business: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to reactivate this business?')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'reactivate-business',
          businessId: params.id
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('Business reactivated successfully')
        fetchBusinessDetail()
      } else {
        alert('Failed to reactivate business: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetTrial = async () => {
    if (!confirm('Reset trial period to 14 days?')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'reset-trial',
          businessId: params.id,
          days: 14
        })
      })
      
      const data = await res.json()
      if (data.success) {
        alert('Trial period reset successfully')
        fetchBusinessDetail()
      } else {
        alert('Failed to reset trial: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Business not found</p>
            <div className="text-center mt-4">
              <Link href="/platform/businesses">
                <Button>Back to Businesses</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const healthScoreColor = business.health_score >= 70 ? 'text-green-600' :
                           business.health_score >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/platform/businesses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Businesses
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-600 mt-1">{business.email}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={
              business.status === 'active' ? 'bg-green-100 text-green-800' :
              business.status === 'suspended' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }>
              {business.status || 'active'}
            </Badge>
            <Badge className={
              business.subscription_status === 'active' ? 'bg-blue-100 text-blue-800' :
              business.subscription_status === 'trial' ? 'bg-purple-100 text-purple-800' :
              'bg-orange-100 text-orange-800'
            }>
              {business.subscription_status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        {business.status !== 'suspended' ? (
          <Button 
            variant="destructive" 
            onClick={() => setSuspendDialog(true)}
            disabled={actionLoading}
          >
            <Ban className="h-4 w-4 mr-2" />
            Suspend Business
          </Button>
        ) : (
          <Button 
            variant="default" 
            onClick={handleReactivate}
            disabled={actionLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Reactivate Business
          </Button>
        )}
        
        {business.subscription_status === 'trial' && (
          <Button 
            variant="outline" 
            onClick={handleResetTrial}
            disabled={actionLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Trial
          </Button>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Health Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${healthScoreColor}`}>
              {business.health_score || 0}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  business.health_score >= 70 ? 'bg-green-500' :
                  business.health_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${business.health_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold">{business.user_count || 0}</div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{business.plan_name || 'N/A'}</div>
            <p className="text-sm text-gray-600 mt-1">
              {business.plan_price ? `₦${business.plan_price.toLocaleString()}/month` : 'Free'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{business.subscription_status}</span>
            </div>
            {business.trial_end_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Trial Ends:</span>
                <span className="font-medium">{new Date(business.trial_end_date).toLocaleDateString()}</span>
              </div>
            )}
            {business.subscription_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription Ends:</span>
                <span className="font-medium">{new Date(business.subscription_end).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{new Date(business.created_at).toLocaleDateString()}</span>
            </div>
            {business.last_activity_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Activity:</span>
                <span className="font-medium">{new Date(business.last_activity_at).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspension Info */}
        {business.status === 'suspended' && business.suspension_reason && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Suspension Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Reason:</span>
                <p className="font-medium text-red-900 mt-1">{business.suspension_reason}</p>
              </div>
              {business.suspended_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Suspended:</span>
                  <span className="font-medium">{new Date(business.suspended_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Business</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending {business.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter suspension reason..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSuspend}
              disabled={actionLoading || !suspendReason.trim()}
            >
              {actionLoading ? 'Suspending...' : 'Suspend Business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
