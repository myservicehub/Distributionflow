'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (reference) {
      verifyPayment(reference)
    } else {
      setError('No payment reference provided')
      setVerifying(false)
    }
  }, [searchParams])

  const verifyPayment = async (reference) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'verify-payment',
          reference: reference
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message || 'Payment verified successfully!',
          subscription: data.subscription
        })
      } else {
        setError(data.error || 'Payment verification failed')
      }
    } catch (err) {
      console.error('Error verifying payment:', err)
      setError('An error occurred while verifying your payment')
    } finally {
      setVerifying(false)
    }
  }

  const goToBilling = () => {
    router.push('/settings/billing?refresh=true')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md border-2 border-neutral-200 shadow-lg">
        <CardHeader className="text-center border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="text-2xl font-bold text-neutral-900">
            Payment Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {verifying ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-emerald-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">
                Verifying your payment...
              </h3>
              <p className="text-neutral-600">
                Please wait while we confirm your subscription
              </p>
            </div>
          ) : result?.success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-success-100 rounded-full">
                  <CheckCircle className="h-16 w-16 text-success-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">
                Payment Successful!
              </h3>
              <p className="text-neutral-600">
                {result.message}
              </p>
              {result.subscription && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold">Plan:</span> {result.subscription.plan_name}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">
                    <span className="font-semibold">Status:</span> {result.subscription.status}
                  </p>
                </div>
              )}
              <Button 
                onClick={goToBilling}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-6"
              >
                Go to Billing Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">
                Payment Verification Failed
              </h3>
              <p className="text-neutral-600">
                {error || 'Unable to verify your payment'}
              </p>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-700">
                  If you were charged, please contact support with your payment reference.
                </p>
              </div>
              <Button 
                onClick={goToBilling}
                variant="outline"
                className="w-full border-2 mt-6"
              >
                Return to Billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
