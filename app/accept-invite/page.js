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
    // Process the invitation token from the URL
    const handleInvitation = async () => {
      try {
        // Get the hash from the URL which contains the token
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('Hash params:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type
        })

        // If we have tokens in the hash, set the session
        if (accessToken && type === 'invite') {
          console.log('Setting session from invitation token...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (error) {
            console.error('Session error:', error)
            setError(`Failed to validate invitation: ${error.message}`)
            setValidating(false)
            return
          }

          console.log('Session set successfully:', data)
          setValidating(false)
          return
        }

        // Otherwise check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Existing session:', session)

        if (sessionError || !session) {
          setError('No active session found. The invitation link may have expired or is invalid. Please request a new invitation.')
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

        // If password is already set, redirect to dashboard
        if (user.user_metadata?.password_set) {
          router.push('/dashboard')
          return
        }

        setValidating(false)
      } catch (err) {
        console.error('Validation error:', err)
        setError('Failed to process invitation. Please try again or request a new invitation.')
        setValidating(false)
      }
    }

    // Give a moment for the page to load, then handle invitation
    const timer = setTimeout(handleInvitation, 500)
    return () => clearTimeout(timer)
  }, [])

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
      // Get the current user first
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        throw new Error('Unable to get current user')
      }

      console.log('Current user before password update:', currentUser)

      // Update the user's password
      const { data: updatedAuth, error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          password_set: true,
          setup_completed: true
        }
      })

      if (updateError) throw updateError

      console.log('Password updated, user:', updatedAuth)

      // Update the user profile in the database with the correct auth_user_id
      // This ensures the profile has the right auth user ID after invitation acceptance
      const { error: profileError } = await supabase
        .from('users')
        .update({
          auth_user_id: currentUser.id
        })
        .eq('email', currentUser.email)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Don't fail the whole flow if this fails
      }

      setSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
        window.location.href = '/dashboard' // Force full page reload to refresh auth state
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
