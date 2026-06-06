'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Package, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PublicNav from '@/components/PublicNav'
import { Badge } from '@/components/ui/badge'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setMessage('Password reset link sent! Check your email.')
      setEmail('')
    } catch (error) {
      setError(error.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <PublicNav />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-xl mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2 tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-neutral-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Reset Card */}
          <Card className="border-2 border-neutral-200 shadow-xl animate-fade-in">
            <CardContent className="pt-6">
              {message && (
                <Alert className="mb-6 border-2 border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 ml-2">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-6 border-2 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-12 border-2 border-neutral-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" 
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-neutral-50 rounded-xl border-2 border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-2">Need Help?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              If you're having trouble resetting your password, contact our support team.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="w-full border-2">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
        </div>
      </footer>
    </div>
  )
}
