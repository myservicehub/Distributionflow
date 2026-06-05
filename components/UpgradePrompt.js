'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Lock, Sparkles, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * UpgradePrompt Component
 * Shows an upgrade message when a feature is not available
 * 
 * @param {string} feature - Feature name
 * @param {string} message - Custom message (optional)
 * @param {string} requiredPlan - Plan required (optional)
 * @param {boolean} inline - Compact inline version (optional)
 */
export function UpgradePrompt({ 
  feature = 'this feature', 
  message,
  requiredPlan = 'Business or Enterprise',
  inline = false 
}) {
  const defaultMessage = `${feature} is available on ${requiredPlan} plan${requiredPlan.includes('or') ? 's' : ''} only.`
  
  if (inline) {
    return (
      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800 flex-1">
          {message || defaultMessage}
        </span>
        <Link href="/settings/billing">
          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
            Upgrade
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Sparkles className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 flex items-center gap-2">
        Premium Feature
        <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          {requiredPlan}
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-amber-800 mt-2">
        <p className="mb-4">{message || defaultMessage}</p>
        <Link href="/settings/billing">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade Now
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}

/**
 * FeatureGate Component
 * Wraps content and shows upgrade prompt if feature is not available
 * 
 * @param {boolean} hasAccess - Whether user has access to the feature
 * @param {ReactNode} children - Content to show when access is granted
 * @param {Object} upgradeProps - Props to pass to UpgradePrompt
 */
export function FeatureGate({ hasAccess, children, ...upgradeProps }) {
  if (!hasAccess) {
    return <UpgradePrompt {...upgradeProps} />
  }

  return <>{children}</>
}

/**
 * PremiumBadge Component
 * Small badge to mark premium features
 */
export function PremiumBadge() {
  return (
    <Badge variant="outline" className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
      <Sparkles className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  )
}
