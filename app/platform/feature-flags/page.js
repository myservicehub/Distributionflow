'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Flag, Search, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function FeatureFlagsPage() {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newFeature, setNewFeature] = useState({ name: '', enabled: true, reason: '' })

  const availableFeatures = [
    'empty_bottle_management',
    'advanced_analytics',
    'bulk_operations',
    'api_access',
    'custom_branding',
    'priority_support',
    'multi_location',
    'inventory_forecasting'
  ]

  useEffect(() => {
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchOverrides()
    }
  }, [selectedBusiness])

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/platform?route=businesses')
      const data = await res.json()
      if (data.success) {
        setBusinesses(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchOverrides = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/platform?route=feature-overrides&businessId=${selectedBusiness}`)
      const data = await res.json()
      if (data.success) {
        setOverrides(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetOverride = async (featureName, enabled) => {
    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'set-feature-override',
          businessId: selectedBusiness,
          featureName,
          enabled,
          reason: 'Manual override by admin'
        })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchOverrides()
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleDeleteOverride = async (featureName) => {
    if (!confirm('Remove this feature override?')) return

    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'delete-feature-override',
          businessId: selectedBusiness,
          featureName
        })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchOverrides()
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleAddFeature = async () => {
    if (!newFeature.name) {
      alert('Please select a feature')
      return
    }

    try {
      const res = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'set-feature-override',
          businessId: selectedBusiness,
          featureName: newFeature.name,
          enabled: newFeature.enabled,
          reason: newFeature.reason || 'Admin override'
        })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchOverrides()
        setDialogOpen(false)
        setNewFeature({ name: '', enabled: true, reason: '' })
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Flag className="h-8 w-8" />
          Feature Flags Management
        </h1>
        <p className="text-gray-600 mt-1">Override features for specific businesses</p>
      </div>

      {/* Business Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Business</CardTitle>
          <CardDescription>Choose a business to manage their feature access</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger>
              <SelectValue placeholder="Select a business..." />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name} - {business.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Feature Overrides */}
      {selectedBusiness && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feature Overrides</CardTitle>
                <CardDescription>
                  Active feature overrides for {businesses.find(b => b.id === selectedBusiness)?.name}
                </CardDescription>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Override
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : overrides.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No feature overrides</p>
                <p className="text-sm">This business uses default plan features</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  Add First Override
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {overrides.map((override) => (
                  <div 
                    key={override.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{override.feature_name}</h3>
                        <Badge className={
                          override.enabled 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {override.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {override.reason && (
                        <p className="text-sm text-gray-600">{override.reason}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(override.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={override.enabled}
                        onCheckedChange={(enabled) => 
                          handleSetOverride(override.feature_name, enabled)
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteOverride(override.feature_name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Override Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feature Override</DialogTitle>
            <DialogDescription>
              Enable or disable a feature for this business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Feature</label>
              <Select value={newFeature.name} onValueChange={(value) => setNewFeature({...newFeature, name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feature..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFeatures.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Feature</label>
              <Switch
                checked={newFeature.enabled}
                onCheckedChange={(enabled) => setNewFeature({...newFeature, enabled})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
              <Textarea
                placeholder="Why is this override needed?"
                value={newFeature.reason}
                onChange={(e) => setNewFeature({...newFeature, reason: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFeature}>
              Add Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
