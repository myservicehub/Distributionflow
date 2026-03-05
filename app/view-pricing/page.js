'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function ViewPricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 20000,
      yearlyPrice: 18000,
      users: 3,
      extraUserCost: 3000,
      description: 'Essential features for small distributors',
      features: [
        { name: 'Core order system', included: true },
        { name: 'Basic empty tracking', included: true },
        { name: '1 warehouse', included: true },
        { name: 'Standard reports', included: true },
        { name: 'Up to 50 retailers', included: true },
        { name: 'In-app notifications', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Email support', included: true },
        { name: 'Empty lifecycle automation', included: false },
        { name: 'Manufacturer tracking', included: false },
        { name: 'SMS alerts', included: false },
        { name: 'API access', included: false }
      ]
    },
    {
      name: 'Business',
      monthlyPrice: 35000,
      yearlyPrice: 31500,
      users: 5,
      extraUserCost: 4000,
      description: 'Advanced features for growing businesses',
      popular: true,
      features: [
        { name: 'Everything in Starter, plus:', included: true, bold: true },
        { name: 'Empty lifecycle automation', included: true },
        { name: 'Manufacturer tracking', included: true },
        { name: 'Walk-in sales handling', included: true },
        { name: 'Reconciliation reports', included: true },
        { name: 'Debt aging report', included: true },
        { name: 'Up to 200 retailers', included: true },
        { name: 'Advanced notifications', included: true },
        { name: 'Priority support', included: true },
        { name: 'Multi-warehouse', included: false },
        { name: 'Fraud detection', included: false },
        { name: 'API access', included: false }
      ]
    },
    {
      name: 'Enterprise',
      monthlyPrice: 70000,
      yearlyPrice: 63000,
      users: 10,
      extraUserCost: 5000,
      description: 'Complete solution for large operations',
      features: [
        { name: 'Everything in Business, plus:', included: true, bold: true },
        { name: 'Multi-warehouse', included: true },
        { name: 'Fraud detection', included: true },
        { name: 'Driver accountability', included: true },
        { name: 'API access', included: true },
        { name: 'SMS alerts', included: true },
        { name: 'Executive reports', included: true },
        { name: 'Unlimited retailers', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom training', included: true },
        { name: 'SLA guarantee', included: true }
      ]
    }
  ]

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan) => {
    const monthlyTotal = plan.monthlyPrice * 12
    const yearlyTotal = plan.yearlyPrice * 12
    return monthlyTotal - yearlyTotal
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900 hover:text-blue-600">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Choose Your Plan
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-4 bg-slate-100 p-2 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Save 10%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 transition-all ${
                plan.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base mb-6">
                  {plan.description}
                </CardDescription>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      ₦{getPrice(plan).toLocaleString()}
                    </span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600">
                      Save ₦{getSavings(plan).toLocaleString()}/year
                    </p>
                  )}
                  
                  {billingCycle === 'yearly' && (
                    <p className="text-xs text-slate-500">
                      Billed ₦{(getPrice(plan) * 12).toLocaleString()} annually
                    </p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900">
                      {plan.users} users included
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      ₦{plan.extraUserCost.toLocaleString()} per additional user/month
                    </p>
                  </div>
                </div>

                <Link href="/signup" className="block w-full mt-6">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                    size="lg"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="pt-6 border-t">
                <p className="font-semibold text-sm text-slate-900 mb-4">
                  What's included:
                </p>
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-slate-700' : 'text-slate-400'
                        } ${feature.bold ? 'font-semibold' : ''}`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="text-center bg-slate-50">
              <CardTitle className="text-2xl">Detailed Feature Comparison</CardTitle>
              <CardDescription>See exactly what's included in each plan</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-slate-900">Feature</th>
                      <th className="text-center p-4 font-semibold text-slate-900">Starter</th>
                      <th className="text-center p-4 font-semibold text-slate-900 bg-blue-50">
                        Business
                        <Badge className="ml-2 bg-blue-600 text-xs">Popular</Badge>
                      </th>
                      <th className="text-center p-4 font-semibold text-slate-900">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <FeatureRow
                      feature="Users included"
                      starter="3 users"
                      business="5 users"
                      enterprise="10 users"
                    />
                    <FeatureRow
                      feature="Extra user cost"
                      starter="₦3,000/mo"
                      business="₦4,000/mo"
                      enterprise="₦5,000/mo"
                    />
                    <FeatureRow
                      feature="Maximum retailers"
                      starter="50"
                      business="200"
                      enterprise="Unlimited"
                    />
                    <FeatureRow
                      feature="Warehouses"
                      starter="1"
                      business="1"
                      enterprise="Unlimited"
                    />
                    <FeatureRow
                      feature="Order management"
                      starter={true}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Inventory tracking"
                      starter={true}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Basic reports"
                      starter={true}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Empty bottle lifecycle"
                      starter={false}
                      business={true}
                      enterprise={true}
                      tooltip="Track empties from manufacturer to retailer and back"
                    />
                    <FeatureRow
                      feature="Manufacturer tracking"
                      starter={false}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Reconciliation reports"
                      starter={false}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Debt aging report"
                      starter={false}
                      business={true}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="Multi-warehouse"
                      starter={false}
                      business={false}
                      enterprise={true}
                      tooltip="Manage multiple warehouse locations"
                    />
                    <FeatureRow
                      feature="Fraud detection"
                      starter={false}
                      business={false}
                      enterprise={true}
                      tooltip="Automated alerts for suspicious activities"
                    />
                    <FeatureRow
                      feature="SMS alerts"
                      starter={false}
                      business={false}
                      enterprise={true}
                    />
                    <FeatureRow
                      feature="API access"
                      starter={false}
                      business={false}
                      enterprise={true}
                      tooltip="Integrate with your existing systems"
                    />
                    <FeatureRow
                      feature="Support"
                      starter="Email"
                      business="Priority email"
                      enterprise="Dedicated manager"
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            <QuickFAQ
              question="Can I change plans later?"
              answer="Yes! You can upgrade anytime (takes effect immediately) or downgrade at your next billing cycle."
            />
            <QuickFAQ
              question="What happens after the trial?"
              answer="Your 14-day free trial gives full access. After it ends, choose a paid plan or your account will be paused (data saved)."
            />
            <QuickFAQ
              question="How do I add more users?"
              answer="Simply add staff from your dashboard. Extra users are billed automatically at your plan's per-user rate."
            />
            <QuickFAQ
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FeatureRow({ feature, starter, business, enterprise, tooltip }) {
  const renderCell = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-slate-300 mx-auto" />
      )
    }
    return <span className="text-sm text-slate-700">{value}</span>
  }

  return (
    <tr className="border-b hover:bg-slate-50">
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-900">{feature}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
      <td className="p-4 text-center">{renderCell(starter)}</td>
      <td className="p-4 text-center bg-blue-50">{renderCell(business)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  )
}

function QuickFAQ({ question, answer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question}</CardTitle>
        <CardDescription className="text-base mt-2">{answer}</CardDescription>
      </CardHeader>
    </Card>
  )
}
