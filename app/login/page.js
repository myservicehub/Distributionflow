'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error) {
      let errorMessage = 'An error occurred'
      
      switch (error) {
        case 'verification_failed':
          errorMessage = 'Email verification failed. Please try signing up again.'
          break
        case 'account_setup_failed':
          errorMessage = message ? decodeURIComponent(message) : 'Account setup failed. Please contact support.'
          break
        case 'callback_error':
          errorMessage = 'An error occurred during login. Please try again.'
          break
        default:
          errorMessage = error
      }
      
      toast.error(errorMessage)
    }
  }, [searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is a super admin
      if (authData?.user) {
        const { data: adminData } = await supabase
          .from('platform_admins')
          .select('id, role')
          .eq('auth_user_id', authData.user.id)
          .eq('status', 'active')
          .single()

        if (adminData && adminData.role === 'super_admin') {
          toast.success('Welcome, Super Admin')
          window.location.href = '/platform/dashboard'
          return
        }
      }

      toast.success('Logged in successfully')
      window.location.href = '/dashboard'
    } catch (error) {
      toast.error(error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow-primary mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            DistributionFlow
          </h1>
          <p className="text-neutral-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-strong">
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                  disabled={loading}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10 border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  New to DistributionFlow?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link href="/signup">
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-neutral-300 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50"
                >
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600 mt-8">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
            Terms of Service
          </Link>
          {' and '}
          <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
