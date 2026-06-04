'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, Check, ArrowRight } from 'lucide-react'
import PublicNav from '@/components/PublicNav'
import { Badge } from '@/components/ui/badge'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'business' // Default to business plan
  
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    ownerName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
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

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Find the plan in database
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('id')
        .ilike('name', selectedPlan.name)
        .single()

      if (planError) {
        console.error('Plan error:', planError)
        throw new Error('Selected plan not found. Please contact support.')
      }

      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // 3. Create business with trial
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.businessName,
          address: formData.address,
          email: formData.email,
          owner_id: authData.user.id,
          plan_id: planData.id,
          subscription_status: 'trial',
          trial_end_date: trialEndDate.toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (businessError) throw businessError

      // 4. Create user profile with admin role
      const { error: userError } = await supabase.from('users').insert({
        business_id: businessData.id,
        auth_user_id: authData.user.id,
        name: formData.ownerName,
        email: formData.email,
        role: 'admin',
        status: 'active',
      })

      if (userError) throw userError

      toast.success('🎉 Account created! Your 14-day free trial has started.')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

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
                    {loading ? 'Creating Account...' : (
                      <>
                        Start Free Trial
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
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
