'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AcceptInviteContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Give Supabase time to process the token from the URL
    const timer = setTimeout(() => {
      checkInvitation()
    }, 1000) // Wait 1 second for Supabase to process

    return () => clearTimeout(timer)
  }, [])

  const checkInvitation = async () => {
    try {
      // Check if user is authenticated via the invitation token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Session:', session)
      console.log('Session error:', sessionError)

      if (sessionError) {
        console.error('Session error:', sessionError)
        setError('Invalid or expired invitation link. Please request a new invitation.')
        setValidating(false)
        return
      }

      if (!session) {
        setError('No active session found. The invitation link may have expired. Please request a new invitation.')
        setValidating(false)
        return
      }

      // Check if password is already set
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Unable to verify user. Please request a new invitation.')
        setValidating(false)
        return
      }

      console.log('User:', user)
      console.log('User metadata:', user.user_metadata)

      // If password is already set, redirect to dashboard
      if (user.user_metadata?.password_set) {
        router.push('/dashboard')
        return
      }

      // Valid invitation, show password setup form
      setValidating(false)
    } catch (err) {
      console.error('Validation error:', err)
      setError('Failed to validate invitation. Please try again or request a new invitation.')
      setValidating(false)
    }
  }

  const handleSetupPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          password_set: true,
          setup_completed: true
        }
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating invitation...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to DistributionFlow!
            </h2>
            <p className="text-gray-600 mb-4">
              Your password has been set successfully. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && validating === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Package className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Invitation Issue
            </h2>
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                This usually happens when:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>The invitation link has expired (24 hours)</li>
                <li>The link has already been used</li>
                <li>The link was copied incorrectly</li>
              </ul>
              <Button onClick={() => router.push('/login')} className="w-full mt-4">
                Go to Login
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                If you continue to have issues, please contact your administrator to resend the invitation.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-full">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to DistributionFlow!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Set up your password to complete your account
          </p>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div>
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Setup & Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>After setting your password, you'll be logged in automatically.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
