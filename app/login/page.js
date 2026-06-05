'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, AlertCircle } from 'lucide-react'
import PublicNav from '@/components/PublicNav'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for error messages from callback
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
          toast.success('Welcome, Super Admin!')
          window.location.href = '/platform/dashboard'
          return
        }
      }

      toast.success('Logged in successfully!')
      window.location.href = '/dashboard'
    } catch (error) {
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PublicNav />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-10 w-10 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your DistributionFlow account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
