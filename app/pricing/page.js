'use client'

import { useState } from 'react'
import { 
  Check, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Package,
  FileText,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'yearly'

  const plans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? 20000 : 18000,
      period: billingCycle === 'monthly' ? 'month' : 'month',
      description: 'Perfect for small distributors getting started',
      users: 3,
      extraUserCost: 3000,
      popular: false,
      color: 'green',
      features: [
        'Core order system',
        'Basic empty tracking',
        '1 warehouse',
        'Standard reports',
        'In-app notifications',
        'Up to 50 retailers',
        'Mobile app access'
      ],
      limitations: [
        'No manufacturer tracking',
        'No reconciliation reports',
        'No SMS alerts'
      ]
    },
    {
      name: 'Business',
      price: billingCycle === 'monthly' ? 35000 : 31500,
      period: billingCycle === 'monthly' ? 'month' : 'month',
      description: 'For growing businesses with advanced needs',
      users: 5,
      extraUserCost: 4000,
      popular: true,
      color: 'blue',
      features: [
        'Everything in Starter, plus:',
        'Full empty lifecycle automation',
        'Manufacturer tracking',
        'Walk-in sales handling',
        'Reconciliation reports',
        'Debt aging report',
        'Advanced notifications',
        'Up to 200 retailers',
        'Priority support'
      ],
      limitations: []
    },
    {
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? 70000 : 63000,
      period: billingCycle === 'monthly' ? 'month' : 'month',
      description: 'Complete solution for large distributors',
      users: 10,
      extraUserCost: 5000,
      popular: false,
      color: 'purple',
      features: [
        'Everything in Business, plus:',
        'Multi-warehouse',
        'Fraud detection',
        'Driver accountability',
        'API access',
        'SMS alerts',
        'Executive reports',
        'Unlimited retailers',
        'Dedicated account manager',
        'Custom integrations'
      ],
      limitations: []
    }
  ]

  const problems = [
    {
      icon: Package,
      title: 'Unreturned Empty Bottles',
      description: 'Lose thousands monthly to untracked empties'
    },
    {
      icon: AlertTriangle,
      title: 'Credit Abuse',
      description: 'Retailers delay payments beyond agreed terms'
    },
    {
      icon: Users,
      title: 'Sales Rep Fraud',
      description: 'Unverified transactions and missing cash'
    },
    {
      icon: TrendingUp,
      title: 'Stock Discrepancies',
      description: 'Warehouse vs. actual stock never match'
    },
    {
      icon: FileText,
      title: 'Manual Record Keeping',
      description: 'Hours wasted on books and Excel sheets'
    }
  ]

  const faqs = [
    {
      question: 'What happens when my trial ends?',
      answer: 'Your 14-day free trial gives you full access to all features. When it ends, you\'ll need to choose a paid plan to continue. Your data is never deleted - you can resume anytime.'
    },
    {
      question: 'Can I add more staff?',
      answer: 'Yes! Each plan includes a set number of users. You can add extra users at ₦3,000 - ₦5,000 per user per month depending on your plan. Additional users are billed automatically.'
    },
    {
      question: 'Can I upgrade or downgrade anytime?',
      answer: 'Absolutely! You can upgrade immediately, and we\'ll prorate the difference. Downgrades are scheduled for your next billing cycle to ensure you get full value from your current plan.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. We use bank-level encryption and host your data on secure cloud servers. Your data is backed up daily, and we\'re fully compliant with data protection standards.'
    },
    {
      question: 'Do you support empty bottle reconciliation?',
      answer: 'Yes! Our Business and Enterprise plans include full empty bottle lifecycle management - from manufacturer supply to retailer returns and reconciliation reports.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major Nigerian payment methods via Paystack: Bank cards, Bank transfer, USSD, and Mobile money. All payments are secure and encrypted.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            🎉 14-Day Free Trial • No Credit Card Required
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Take Full Control of Your<br />
            <span className="text-blue-600">Distribution Business</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Stop losing money to debt, empty bottles, and untracked deliveries.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Book a Demo
            </Button>
          </div>
          
          <p className="text-sm text-slate-500">
            ✓ No setup fee &nbsp;•&nbsp; ✓ Cancel anytime &nbsp;•&nbsp; ✓ Free support
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-100 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                The Challenges You Face Daily
              </h2>
              <p className="text-lg text-slate-600">
                Running a distribution business in Nigeria is hard. These problems drain your profits:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.slice(0, 3).map((problem, index) => (
                <Card key={index} className="border-2 hover:border-red-200 transition-all">
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                      <problem.icon className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">{problem.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-2xl mx-auto">
              {problems.slice(3).map((problem, index) => (
                <Card key={index} className="border-2 hover:border-red-200 transition-all">
                  <CardHeader>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                      <problem.icon className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">{problem.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Choose the plan that fits your business. All plans include 14-day free trial.
              </p>

              {/* Billing Toggle */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative border-2 transition-all hover:shadow-xl ${
                    plan.popular
                      ? 'border-blue-500 shadow-lg scale-105 md:scale-110'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-semibold">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    
                    <div className="mt-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900">
                          ₦{plan.price.toLocaleString()}
                        </span>
                        <span className="text-slate-600">/ {plan.period}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-green-600 mt-1">
                          Save ₦{((plan.price / 0.9 - plan.price) * 12).toLocaleString()} per year
                        </p>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">{plan.users} users included</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        ₦{plan.extraUserCost.toLocaleString()} per extra user/month
                      </p>
                    </div>

                    <Button
                      className={`w-full mt-6 ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                      size="lg"
                    >
                      Start Free Trial
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className={`text-sm ${feature.includes('Everything') ? 'font-semibold' : ''}`}>
                          {feature}
                        </span>
                      </div>
                    ))}

                    {plan.limitations.length > 0 && (
                      <>
                        <div className="border-t pt-3 mt-4">
                          {plan.limitations.map((limitation, i) => (
                            <div key={i} className="flex items-start gap-3 opacity-50">
                              <X className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-600">{limitation}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-slate-600 mt-8">
              Need more than 10 users? <a href="#" className="text-blue-600 hover:underline font-medium">Contact us for custom Enterprise pricing</a>
            </p>
          </div>
        </div>
      </section>

      {/* Value Comparison Section */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Manual System vs Our Platform
              </h2>
              <p className="text-lg text-slate-600">
                See why modern distributors are switching to automated solutions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual System */}
              <Card className="border-2 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-900 flex items-center gap-2">
                    <X className="w-6 h-6" />
                    Manual System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">No empty reconciliation</p>
                      <p className="text-sm text-slate-600">Lose thousands to untracked bottles</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Poor debt tracking</p>
                      <p className="text-sm text-slate-600">Credit abuse and late payments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">No stock reservation</p>
                      <p className="text-sm text-slate-600">Overselling and shortages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Hours on Excel sheets</p>
                      <p className="text-sm text-slate-600">Manual data entry and errors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">No fraud detection</p>
                      <p className="text-sm text-slate-600">Sales rep manipulation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Our Platform */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-900 flex items-center gap-2">
                    <Check className="w-6 h-6" />
                    Our Platform
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Automated empty lifecycle</p>
                      <p className="text-sm text-slate-600">Track every bottle from issue to return</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Credit control automation</p>
                      <p className="text-sm text-slate-600">Block orders when credit limit exceeded</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Real-time warehouse tracking</p>
                      <p className="text-sm text-slate-600">Know exact stock levels instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Instant reports & analytics</p>
                      <p className="text-sm text-slate-600">One-click insights and dashboards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Built-in fraud protection</p>
                      <p className="text-sm text-slate-600">Driver accountability and audit trails</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to know about our pricing and plans
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Control Your Distribution?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of Nigerian distributors who have taken control of their business.
              Start your free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-slate-50">
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10"
              >
                Talk to Sales
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                14-day free trial
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                No credit card required
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Setup in 5 minutes
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// FAQ Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-2 hover:border-slate-300 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 mb-1">{question}</h3>
          {isOpen && (
            <p className="text-slate-600 mt-3 leading-relaxed">{answer}</p>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
    </Card>
  )
}
