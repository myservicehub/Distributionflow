'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default function FeatureLockedAlert({ featureName, planRequired = 'Business' }) {
  return (
    <Alert className="border-orange-500 bg-orange-50">
      <Lock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between text-orange-800">
        <div>
          <strong>{featureName}</strong> is not available on your current plan.
          Upgrade to the {planRequired} plan to access this feature.
        </div>
        <Link href="/settings/billing">
          <Button variant="outline" size="sm" className="ml-4">
            Upgrade Now
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
