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
import { Package, ArrowRight, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PublicNav from '@/components/PublicNav'

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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <PublicNav />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Secure Login
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-neutral-600">
              Sign in to access your distribution dashboard
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-2 border-neutral-200 shadow-xl animate-fade-in">
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
                    className="h-12 border-2 border-neutral-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                      className="h-12 pr-12 border-2 border-neutral-200 focus:border-emerald-500 focus:ring-emerald-500"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
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
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg group"
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
                    className="w-full h-12 border-2 border-neutral-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
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
            <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Terms of Service
            </Link>
            {' and '}
            <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Privacy Policy
            </Link>
          </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
