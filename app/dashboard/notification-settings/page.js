'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Bell, DollarSign, Package, AlertTriangle } from 'lucide-react'

export default function NotificationSettingsPage() {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    notifications: {
      payment_threshold: 50000,
      low_stock_threshold: 10,
      high_credit_threshold: 100000,
      large_stock_deduction: 50,
      large_stock_addition: 100,
      enabled_types: ['payment', 'order', 'inventory', 'staff', 'credit']
    }
  })

  const supabase = createClient()

  // Only admins can access notification settings
  if (userProfile?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can configure notification settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    if (userProfile) {
      loadSettings()
    }
  }, [userProfile])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', userProfile.business_id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data?.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)

      // Check if settings record exists
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .eq('business_id', userProfile.business_id)
        .maybeSingle()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('business_settings')
          .update({
            settings: settings,
            updated_at: new Date().toISOString()
          })
          .eq('business_id', userProfile.business_id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('business_settings')
          .insert({
            business_id: userProfile.business_id,
            settings: settings
          })

        if (error) throw error
      }

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const toggleNotificationType = (type) => {
    setSettings(prev => {
      const currentTypes = prev.notifications.enabled_types || []
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type]
      
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          enabled_types: newTypes
        }
      }
    })
  }

  const isTypeEnabled = (type) => {
    return settings.notifications.enabled_types?.includes(type) ?? true
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Notification Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure notification thresholds and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure when to receive notifications for sensitive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Threshold */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Label htmlFor="payment-threshold" className="text-base font-medium">
                Large Payment Threshold
              </Label>
            </div>
            <p className="text-sm text-gray-500">
              Receive notifications for payments equal to or above this amount
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg">₦</span>
              <Input
                id="payment-threshold"
                type="number"
                value={settings.notifications.payment_threshold}
                onChange={(e) => updateNotificationSetting('payment_threshold', parseInt(e.target.value))}
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-medium">Inventory Thresholds</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="low-stock" className="text-sm">
                  Low Stock Alert
                </Label>
                <p className="text-xs text-gray-500">
                  Alert when stock falls below
                </p>
                <Input
                  id="low-stock"
                  type="number"
                  value={settings.notifications.low_stock_threshold}
                  onChange={(e) => updateNotificationSetting('low_stock_threshold', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="large-deduction" className="text-sm">
                  Large Deduction
                </Label>
                <p className="text-xs text-gray-500">
                  Alert for stock out ≥
                </p>
                <Input
                  id="large-deduction"
                  type="number"
                  value={settings.notifications.large_stock_deduction}
                  onChange={(e) => updateNotificationSetting('large_stock_deduction', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="large-addition" className="text-sm">
                  Large Addition
                </Label>
                <p className="text-xs text-gray-500">
                  Alert for stock in ≥
                </p>
                <Input
                  id="large-addition"
                  type="number"
                  value={settings.notifications.large_stock_addition}
                  onChange={(e) => updateNotificationSetting('large_stock_addition', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Credit Threshold */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="credit-threshold" className="text-base font-medium">
              High Credit Balance Threshold
            </Label>
            <p className="text-sm text-gray-500">
              Alert when a retailer's credit balance exceeds this amount
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg">₦</span>
              <Input
                id="credit-threshold"
                type="number"
                value={settings.notifications.high_credit_threshold}
                onChange={(e) => updateNotificationSetting('high_credit_threshold', parseInt(e.target.value))}
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-medium">Notification Types</h3>
            <p className="text-sm text-gray-500">
              Choose which types of notifications you want to receive
            </p>

            <div className="space-y-3">
              {[
                { type: 'payment', label: 'Payment Notifications', desc: 'Large payments and payment edits' },
                { type: 'order', label: 'Order Notifications', desc: 'Order approvals, cancellations, and dispatches' },
                { type: 'inventory', label: 'Inventory Notifications', desc: 'Stock adjustments and low stock alerts' },
                { type: 'staff', label: 'Staff Notifications', desc: 'Staff additions, role changes, and deactivations' },
                { type: 'credit', label: 'Credit Notifications', desc: 'Credit limit changes and high balances' }
              ].map(({ type, label, desc }) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Switch
                    checked={isTypeEnabled(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={loadSettings} disabled={saving}>
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
