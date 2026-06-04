'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, Check, ArrowRight, Mail, RefreshCw } from 'lucide-react'
import PublicNav from '@/components/PublicNav'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function SignupForm() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'business'
  
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    ownerName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const plans = {
    starter: {
      name: 'Starter',
      price: 20000,
      users: 3,
      features: ['Core order system', 'Basic empty tracking', '1 warehouse', 'Up to 50 retailers']
    },
    business: {
      name: 'Business',
      price: 35000,
      users: 5,
      features: ['Everything in Starter', 'Full empty lifecycle', 'Manufacturer tracking', 'Up to 200 retailers']
    },
    enterprise: {
      name: 'Enterprise',
      price: 70000,
      users: 10,
      features: ['Everything in Business', 'Multi-warehouse', 'Fraud detection', 'Unlimited retailers']
    }
  }

  const selectedPlan = plans[planId] || plans.business

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleResendEmail = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      })

      if (error) throw error
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      toast.error(error.message || 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            business_name: formData.businessName,
            full_name: formData.ownerName
          }
        }
      })

      if (authError) throw authError

      // Check if email confirmation is required
      if (authData.user && !authData.user.confirmed_at) {
        // Email confirmation required
        setUserEmail(formData.email)
        setEmailSent(true)
        setLoading(false)
        return
      }

      // If no email confirmation needed, continue with business creation
      // 2. Create business (basic fields only - works without migrations)
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.businessName,
          address: formData.address,
          owner_id: authData.user.id
        })
        .select()
        .single()

      if (businessError) {
        console.error('Business creation error:', businessError)
        throw new Error(`Failed to create business: ${businessError.message}`)
      }

      // 3. Try to update with subscription fields (will fail gracefully if columns don't exist)
      try {
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 14)

        // Find the plan in database
        const { data: planData } = await supabase
          .from('plans')
          .select('id')
          .ilike('name', selectedPlan.name)
          .single()

        if (planData) {
          await supabase
            .from('businesses')
            .update({
              plan_id: planData.id,
              subscription_status: 'trial',
              trial_end_date: trialEndDate.toISOString(),
              status: 'active'
            })
            .eq('id', businessData.id)
        }
      } catch (subscriptionError) {
        console.log('Note: Subscription fields not available. Please run subscription migration.')
      }

      // 4. Create user profile with admin role
      const { error: userError } = await supabase.from('users').insert({
        business_id: businessData.id,
        auth_user_id: authData.user.id,
        name: formData.ownerName,
        email: formData.email,
        role: 'admin',
        is_active: true,
      })

      if (userError) {
        console.error('User creation error:', userError)
        throw new Error(`Failed to create user profile: ${userError.message}`)
      }

      toast.success('🎉 Account created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
      setLoading(false)
    }
  }

  // Show email verification screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <PublicNav />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px)] flex items-center justify-center">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a verification link to <strong>{userEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  What to do next:
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Check your email inbox (and spam folder)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Click the verification link in the email</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>You'll be automatically redirected to your dashboard</span>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Didn't receive the email?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    Wrong email address?
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEmailSent(false)
                      setUserEmail('')
                    }}
                  >
                    Try Again with Different Email
                  </Button>
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Need help?{' '}
                    <Link href="/support" className="text-blue-600 hover:underline font-medium">
                      Contact Support
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PublicNav />
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px)]">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-green-100 text-green-700">
              🎉 14-Day Free Trial - No Credit Card Required
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Start Your Free Trial
            </h1>
            <p className="text-gray-600">
              Create your account and start managing your distribution business today
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Selected Plan Card */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{selectedPlan.name} Plan</CardTitle>
                  <Badge className="bg-blue-600 text-white">Selected</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ₦{selectedPlan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="text-base mt-2">
                  After your 14-day free trial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{selectedPlan.users} users included</span>
                  </div>
                  {selectedPlan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    Change Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Signup Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Fill in your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="ABC Distributors Ltd"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Market Street, Lagos"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Your Full Name *</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      placeholder="John Doe"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@abcdistributors.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      We'll send a verification link to this email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-600">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>

                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Email verification required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
