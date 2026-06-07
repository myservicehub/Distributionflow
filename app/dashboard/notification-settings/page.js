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
      enabled_types: ['payment', 'order', 'inventory', 'staff', 'credit'],
      email_notifications_enabled: true
    }
  })

  const supabase = createClient()

  // Only admins can access notification settings
  if (userProfile?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-neutral-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
            <p className="text-neutral-600">Only administrators can configure notification settings.</p>
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
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-neutral-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="animate-slide-down">
        <h1 className="text-4xl font-bold text-neutral-900 tracking-tight flex items-center gap-3">
          <Bell className="h-8 w-8 text-emerald-600" />
          Notification Settings
        </h1>
        <p className="text-neutral-600 mt-2">Configure notification thresholds and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card className="border-2 border-neutral-200 shadow-lg animate-fade-in">
        <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Bell className="h-5 w-5 text-emerald-600" />
            Alert Thresholds
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Configure when to receive notifications for sensitive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Payment Threshold */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-success-50 to-white rounded-lg border-2 border-success-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-success-700" />
              </div>
              <Label htmlFor="payment-threshold" className="text-base font-bold text-neutral-900">
                Large Payment Threshold
              </Label>
            </div>
            <p className="text-sm text-neutral-600">
              Receive notifications for payments equal to or above this amount
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-neutral-900">₦</span>
              <Input
                id="payment-threshold"
                type="number"
                value={settings.notifications.payment_threshold}
                onChange={(e) => updateNotificationSetting('payment_threshold', parseInt(e.target.value))}
                className="max-w-xs border-2 focus:border-emerald-300"
              />
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-700" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Inventory Thresholds</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="low-stock" className="text-sm font-medium text-neutral-900">
                  Low Stock Alert
                </Label>
                <p className="text-xs text-neutral-500">
                  Alert when stock falls below
                </p>
                <Input
                  id="low-stock"
                  type="number"
                  value={settings.notifications.low_stock_threshold}
                  onChange={(e) => updateNotificationSetting('low_stock_threshold', parseInt(e.target.value))}
                  className="border-2 focus:border-emerald-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="large-deduction" className="text-sm font-medium text-neutral-900">
                  Large Deduction
                </Label>
                <p className="text-xs text-neutral-500">
                  Alert for stock out ≥
                </p>
                <Input
                  id="large-deduction"
                  type="number"
                  value={settings.notifications.large_stock_deduction}
                  onChange={(e) => updateNotificationSetting('large_stock_deduction', parseInt(e.target.value))}
                  className="border-2 focus:border-emerald-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="large-addition" className="text-sm font-medium text-neutral-900">
                  Large Addition
                </Label>
                <p className="text-xs text-neutral-500">
                  Alert for stock in ≥
                </p>
                <Input
                  id="large-addition"
                  type="number"
                  value={settings.notifications.large_stock_addition}
                  onChange={(e) => updateNotificationSetting('large_stock_addition', parseInt(e.target.value))}
                  className="border-2 focus:border-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Credit Threshold */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-orange-50 to-white rounded-lg border-2 border-orange-200">
            <Label htmlFor="credit-threshold" className="text-base font-bold text-neutral-900">
              High Credit Balance Threshold
            </Label>
            <p className="text-sm text-neutral-600">
              Alert when a retailer's credit balance exceeds this amount
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-neutral-900">₦</span>
              <Input
                id="credit-threshold"
                type="number"
                value={settings.notifications.high_credit_threshold}
                onChange={(e) => updateNotificationSetting('high_credit_threshold', parseInt(e.target.value))}
                className="max-w-xs border-2 focus:border-emerald-300"
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4 pt-4 border-t-2 border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900">Notification Types</h3>
            <p className="text-sm text-neutral-600">
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
                <div key={type} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200 hover:border-emerald-300 transition-all">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-600 mt-1">{desc}</p>
                  </div>
                  <Switch
                    checked={isTypeEnabled(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="space-y-4 pt-4 border-t-2 border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900">Email Notifications</h3>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-300 rounded-lg hover:border-blue-400 transition-all">
              <div className="flex-1">
                <p className="font-bold text-sm text-blue-900">Send Critical Alerts via Email</p>
                <p className="text-xs text-blue-700 mt-1">
                  Receive email notifications for critical alerts like order cancellations, large payments, and low stock warnings
                </p>
              </div>
              <Switch
                checked={settings.notifications.email_notifications_enabled ?? true}
                onCheckedChange={(checked) => updateNotificationSetting('email_notifications_enabled', checked)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t-2 border-neutral-200 flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={loadSettings} 
              disabled={saving}
              className="border-2 hover:border-neutral-400 h-12"
            >
              Reset
            </Button>
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
