'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Ban, Play, RotateCcw, UserCog, AlertTriangle, Building2, Users, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id
  
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [resetTrialDialogOpen, setResetTrialDialogOpen] = useState(false)
  const [trialDays, setTrialDays] = useState(14)

  useEffect(() => {
    fetchBusinessDetail()
  }, [businessId])

  const fetchBusinessDetail = async () => {
    try {
      const res = await fetch(`/api/platform?route=business-detail&id=${businessId}`)
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
      toast.error('Please provide a reason for suspension')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'suspend-business',
          businessId,
          reason: suspendReason
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Business suspended successfully')
        setSuspendDialogOpen(false)
        fetchBusinessDetail()
      } else {
        toast.error(data.error || 'Failed to suspend business')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'reactivate-business',
          businessId
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Business reactivated successfully')
        fetchBusinessDetail()
      } else {
        toast.error(data.error || 'Failed to reactivate business')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetTrial = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'reset-trial',
          businessId,
          days: trialDays
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Trial reset for ${trialDays} days`)
        setResetTrialDialogOpen(false)
        fetchBusinessDetail()
      } else {
        toast.error(data.error || 'Failed to reset trial')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleImpersonate = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'impersonate',
          businessId
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Impersonation session created')
        // Redirect to business dashboard
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Failed to create impersonation session')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const getHealthColor = (score) => {
    if (!score) return 'text-gray-500'
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Business Not Found</h2>
          <p className="text-gray-500 mt-2">The business you're looking for doesn't exist.</p>
          <Link href="/platform/businesses">
            <Button className="mt-4">Back to Businesses</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform/businesses">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-500 mt-1">{business.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={business.subscription_status === 'active' ? 'default' : 'secondary'}>
            {business.subscription_status}
          </Badge>
          <Badge variant={business.status === 'suspended' ? 'destructive' : 'outline'}>
            {business.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="health">Health & Risk</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Business ID:</span>
                  <span className="font-mono text-sm">{business.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner ID:</span>
                  <span className="font-mono text-sm">{business.owner_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(business.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Activity:</span>
                  <span>{business.last_activity_at ? new Date(business.last_activity_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{business.plans?.display_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={business.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {business.subscription_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trial End:</span>
                  <span>{business.trial_end_date ? new Date(business.trial_end_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="capitalize">{business.billing_cycle || 'monthly'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  {business.active_users || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  of {business.plans?.included_users || 0} included
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Retailers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-green-500" />
                  {business.retailers_count || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Orders (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-purple-500" />
                  {business.orders_last_30_days || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-orange-500" />
                  {business.products_count || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Current billing details and history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-gray-600">Base Price</Label>
                  <p className="text-2xl font-bold">₦{business.plans?.base_price?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Extra Users Cost</Label>
                  <p className="text-2xl font-bold">
                    ₦{((business.active_users - (business.plans?.included_users || 0)) * (business.plans?.price_per_extra_user || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Health Score</CardTitle>
              <CardDescription>Overall health and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className={`text-6xl font-bold ${getHealthColor(business.health_score)}`}>
                  {business.health_score || 0}%
                </div>
                <p className="text-gray-600 mt-2">
                  {business.health_score >= 70 && '🟢 Healthy - Low risk'}
                  {business.health_score >= 40 && business.health_score < 70 && '🟡 Moderate - Monitor closely'}
                  {business.health_score < 40 && '🔴 At Risk - Immediate attention needed'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Manage this business account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {business.status === 'active' ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setSuspendDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Business
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleReactivate}
                  disabled={actionLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Reactivate Business
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setResetTrialDialogOpen(true)}
                disabled={actionLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Trial Period
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={handleImpersonate}
                disabled={actionLoading}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Impersonate Business
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Business</DialogTitle>
            <DialogDescription>
              This will immediately block all users from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Suspension *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for suspending this business..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={actionLoading}>
              Suspend Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Trial Dialog */}
      <Dialog open={resetTrialDialogOpen} onOpenChange={setResetTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Trial Period</DialogTitle>
            <DialogDescription>
              Extend the trial period for this business.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="days">Trial Duration (days)</Label>
              <Input
                id="days"
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value))}
                min="1"
                max="90"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTrialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetTrial} disabled={actionLoading}>
              Reset Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
