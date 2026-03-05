'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Users, Calendar, AlertTriangle, Check, TrendingUp } from 'lucide-react'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [billingData, setBillingData] = useState(null)
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [processingUpgrade, setProcessingUpgrade] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchBillingData()
    fetchPlans()
    fetchInvoices()
  }, [])

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/subscriptions?route=get-billing-details')
      const result = await response.json()

      if (result.success) {
        setBillingData(result.data)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions?route=get-plans')
      const result = await response.json()

      if (result.success) {
        setPlans(result.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/subscriptions?route=get-invoices')
      const result = await response.json()

      if (result.success) {
        setInvoices(result.data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const handleUpgrade = async (planId) => {
    setProcessingUpgrade(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'create-subscription-checkout',
          plan_id: planId,
          billing_cycle: 'monthly'
        })
      })

      const result = await response.json()

      if (result.success && result.data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = result.data.authorization_url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setProcessingUpgrade(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentPlan = billingData?.plan
  const subscriptionStatus = billingData?.subscription_status
  const trialEndDate = billingData?.trial_end_date
  const isOnTrial = subscriptionStatus === 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isActive = subscriptionStatus === 'active'

  const daysUntilTrialEnd = isOnTrial && trialEndDate
    ? Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  const activeUsers = billingData?.active_users || 0
  const includedUsers = currentPlan?.included_users || 0
  const extraUsers = Math.max(0, activeUsers - includedUsers)
  const usagePercentage = (activeUsers / includedUsers) * 100

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and billing details
        </p>
      </div>

      {/* Trial Warning */}
      {isOnTrial && daysUntilTrialEnd <= 7 && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your trial ends in <strong>{daysUntilTrialEnd} day{daysUntilTrialEnd !== 1 ? 's' : ''}</strong>.
            Upgrade now to continue using all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Expired Warning */}
      {isExpired && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your subscription has expired. Please upgrade to continue using the platform.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{currentPlan?.display_name}</span>
                <Badge variant={isActive ? 'default' : isOnTrial ? 'secondary' : 'destructive'}>
                  {subscriptionStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                ₦{currentPlan?.base_price?.toLocaleString()}/month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{activeUsers}</span>
                <span className="text-sm text-muted-foreground">
                  of {includedUsers} included
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePercentage >= 100
                      ? 'bg-red-500'
                      : usagePercentage >= 80
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>

              {extraUsers > 0 && (
                <p className="text-sm text-orange-600">
                  +{extraUsers} extra user{extraUsers !== 1 ? 's' : ''} (₦{(extraUsers * (currentPlan?.price_per_extra_user || 0)).toLocaleString()}/mo)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Billing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isOnTrial ? 'Trial Ends' : 'Next Billing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold">
                {isOnTrial
                  ? `${daysUntilTrialEnd} days`
                  : billingData?.subscription_end
                  ? new Date(billingData.subscription_end).toLocaleDateString()
                  : 'N/A'}
              </span>
              {!isOnTrial && billingData?.total_amount && (
                <p className="text-sm text-muted-foreground">
                  ₦{billingData.total_amount.toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your business needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id
              const features = plan.features || {}

              return (
                <Card key={plan.id} className={isCurrent ? 'border-primary border-2' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                      {isCurrent && <Badge>Current</Badge>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <span className="text-3xl font-bold">
                          ₦{plan.base_price?.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>{plan.included_users} users included</p>
                        <p>₦{plan.price_per_extra_user?.toLocaleString()} per extra user</p>
                      </div>

                      <ul className="space-y-2 text-sm">
                        {features.empty_lifecycle && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Empty Bottle Lifecycle
                          </li>
                        )}
                        {features.fraud_detection && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Fraud Detection
                          </li>
                        )}
                        {features.sms_alerts && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            SMS Alerts
                          </li>
                        )}
                        {features.advanced_reports && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Advanced Reports
                          </li>
                        )}
                        {features.multi_warehouse && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Multi-Warehouse
                          </li>
                        )}
                        {features.api_access && (
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            API Access
                          </li>
                        )}
                      </ul>

                      {!isCurrent && (
                        <Button
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={processingUpgrade}
                        >
                          {processingUpgrade ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Upgrade to {plan.display_name}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your billing history and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No invoices yet
            </p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{invoice.amount?.toLocaleString()}</p>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
