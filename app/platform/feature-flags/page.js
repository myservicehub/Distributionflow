'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Flag, Search } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_FEATURES = [
  { key: 'empty_lifecycle', name: 'Empty Bottle Lifecycle', description: 'Track empty bottles from distribution to return' },
  { key: 'multi_warehouse', name: 'Multi-Warehouse', description: 'Manage multiple warehouse locations' },
  { key: 'fraud_detection', name: 'Fraud Detection', description: 'AI-powered fraud detection system' },
  { key: 'sms_alerts', name: 'SMS Alerts', description: 'Send SMS notifications to retailers' },
  { key: 'api_access', name: 'API Access', description: 'Access to public API' },
  { key: 'advanced_reports', name: 'Advanced Reports', description: 'Detailed analytics and reporting' },
]

export default function FeatureFlagsPage() {
  const [businesses, setBusinesses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [overrides, setOverrides] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [overrideData, setOverrideData] = useState({ feature: '', enabled: false, reason: '' })

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/platform?route=businesses')
      const data = await res.json()
      if (data.success) {
        setBusinesses(data.data)
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverrides = async (businessId) => {
    try {
      const res = await fetch(`/api/platform?route=feature-overrides&businessId=${businessId}`)
      const data = await res.json()
      if (data.success) {
        const overridesMap = {}
        data.data.forEach(override => {
          overridesMap[override.feature_name] = override
        })
        setOverrides(overridesMap)
      }
    } catch (error) {
      console.error('Error fetching overrides:', error)
    }
  }

  const handleBusinessSelect = async (business) => {
    setSelectedBusiness(business)
    await fetchOverrides(business.id)
  }

  const handleToggleOverride = async (featureKey, currentStatus, reason = '') => {
    if (!selectedBusiness) return

    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'set-feature-override',
          businessId: selectedBusiness.id,
          featureName: featureKey,
          enabled: !currentStatus,
          reason
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Feature override updated')
        await fetchOverrides(selectedBusiness.id)
      } else {
        toast.error(data.error || 'Failed to update override')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteOverride = async (featureKey) => {
    if (!selectedBusiness) return

    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'delete-feature-override',
          businessId: selectedBusiness.id,
          featureName: featureKey
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Feature override removed')
        await fetchOverrides(selectedBusiness.id)
      } else {
        toast.error(data.error || 'Failed to remove override')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const hasFeatureInPlan = (featureKey) => {
    if (!selectedBusiness?.plans?.features) return false
    return selectedBusiness.plans.features[featureKey] === true
  }

  const hasOverride = (featureKey) => {
    return overrides[featureKey] !== undefined
  }

  const getEffectiveStatus = (featureKey) => {
    // If plan has feature, always true
    if (hasFeatureInPlan(featureKey)) return true
    // If override exists and plan doesn't have it, use override
    if (hasOverride(featureKey)) return overrides[featureKey].enabled
    // Default: false
    return false
  }

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-gray-500 mt-2">Override plan features for specific businesses</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Business</CardTitle>
            <CardDescription>Choose a business to manage feature overrides</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Business List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBusinesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleBusinessSelect(business)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedBusiness?.id === business.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{business.name}</div>
                  <div className="text-sm text-gray-500">{business.plans?.display_name || 'N/A'}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Feature Overrides
            </CardTitle>
            <CardDescription>
              {selectedBusiness 
                ? `Managing features for ${selectedBusiness.name}`
                : 'Select a business to manage features'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBusiness ? (
              <div className="text-center py-12 text-gray-500">
                <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a business from the list to manage feature overrides</p>
              </div>
            ) : (
              <div className="space-y-4">
                {AVAILABLE_FEATURES.map((feature) => {
                  const inPlan = hasFeatureInPlan(feature.key)
                  const hasOverrideFlag = hasOverride(feature.key)
                  const effectiveStatus = getEffectiveStatus(feature.key)

                  return (
                    <div
                      key={feature.key}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{feature.name}</h3>
                          {inPlan && (
                            <Badge variant="outline" className="text-xs">
                              In Plan
                            </Badge>
                          )}
                          {hasOverrideFlag && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Override
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                        {hasOverrideFlag && overrides[feature.key].reason && (
                          <p className="text-xs text-gray-400 mt-2 italic">
                            Reason: {overrides[feature.key].reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Switch
                          checked={effectiveStatus}
                          onCheckedChange={() => {
                            if (inPlan) {
                              toast.info('Feature already included in plan')
                              return
                            }
                            setOverrideData({
                              feature: feature.key,
                              enabled: !effectiveStatus,
                              reason: ''
                            })
                            setDialogOpen(true)
                          }}
                          disabled={inPlan}
                        />
                        {hasOverrideFlag && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteOverride(feature.key)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove Override
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Feature Override</DialogTitle>
            <DialogDescription>
              Provide a reason for overriding this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Feature</Label>
              <p className="text-sm text-gray-600">
                {AVAILABLE_FEATURES.find(f => f.key === overrideData.feature)?.name}
              </p>
            </div>
            <div>
              <Label>Action</Label>
              <p className="text-sm text-gray-600">
                {overrideData.enabled ? 'Enable' : 'Disable'} for this business
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Why are you overriding this feature?"
                value={overrideData.reason}
                onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleToggleOverride(overrideData.feature, !overrideData.enabled, overrideData.reason)
                setDialogOpen(false)
              }}
              disabled={!overrideData.reason.trim()}
            >
              Set Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
