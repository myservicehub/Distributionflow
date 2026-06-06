import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  TrendingUp, 
  Users, 
  Shield,
  Smartphone,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Target,
  Award,
  ChevronDown
} from 'lucide-react'
import PublicNav from '@/components/PublicNav'

export default function Home() {
  const features = [
    {
      icon: Package,
      title: 'Empty Bottle Tracking',
      description: 'Track every bottle from delivery to return. Recover lost revenue from unreturned empties with automated tracking.',
    },
    {
      icon: DollarSign,
      title: 'Smart Credit Control',
      description: 'Set limits, track payments, and get aging reports automatically. Stop credit abuse before it hurts your cash flow.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'See your sales, stock, and debt status instantly. Make informed decisions with live business intelligence.',
    },
    {
      icon: Users,
      title: 'Sales Team Management',
      description: 'Track every rep, transaction, and delivery. Eliminate fraud and ensure accountability across your team.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Platform',
      description: 'Perfect for field sales teams. Works seamlessly on smartphones, tablets, and desktops anywhere.',
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'Automated alerts for suspicious activities. Protect your business with built-in security features.',
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Sign Up in Minutes',
      description: 'Create your account, add your business details, and set up your team in less than 5 minutes.'
    },
    {
      number: '02',
      title: 'Add Your Products & Retailers',
      description: 'Import your product catalog and retailer list. Set credit limits and pricing instantly.'
    },
    {
      number: '03',
      title: 'Start Tracking',
      description: 'Your sales reps use their phones to record orders, track empties, and collect payments in real-time.'
    },
    {
      number: '04',
      title: 'Watch Your Business Grow',
      description: 'Monitor analytics, recover lost revenue, prevent fraud, and make data-driven decisions daily.'
    }
  ]

  const benefits = [
    {
      icon: TrendingUp,
      stat: '₦500K+',
      label: 'Average Monthly Savings',
      description: 'Recovered from empties and reduced fraud'
    },
    {
      icon: Clock,
      stat: '85%',
      label: 'Faster Processing',
      description: 'No more manual books and spreadsheets'
    },
    {
      icon: Target,
      stat: '24/7',
      label: 'Business Visibility',
      description: 'Check your business from anywhere, anytime'
    }
  ]

  const testimonials = [
    {
      name: 'Chidi Okafor',
      business: 'Okafor Beverages Ltd',
      location: 'Lagos',
      quote: 'We recovered over ₦800,000 in unreturned empties in just 3 months. This system paid for itself immediately.',
      rating: 5
    },
    {
      name: 'Amina Hassan',
      business: 'Hassan Distributors',
      location: 'Kano',
      quote: 'Credit control was our biggest problem. Now we automatically block orders when limits are exceeded. Game changer!',
      rating: 5
    },
    {
      name: 'David Eze',
      business: 'Eze & Sons Distribution',
      location: 'Enugu',
      quote: 'My sales reps can no longer manipulate records. Everything is tracked automatically. My stress reduced by 90%.',
      rating: 5
    }
  ]

  const faqs = [
    {
      question: 'How long does setup take?',
      answer: 'Most businesses are up and running in less than 5 minutes. You can add products, retailers, and team members right away.'
    },
    {
      question: 'Do I need technical skills?',
      answer: 'No technical skills required. The platform is designed for distributors, not IT experts. If you can use WhatsApp, you can use DistributionFlow.'
    },
    {
      question: 'What if my sales reps don\'t have smartphones?',
      answer: 'The system works on any smartphone, including affordable Android devices. Most sales reps already have suitable phones.'
    },
    {
      question: 'Can I try before I buy?',
      answer: 'Yes! We offer a 14-day free trial with no credit card required. Test all features with your actual business data.'
    },
    {
      question: 'How secure is my business data?',
      answer: 'Your data is encrypted, backed up daily, and stored on secure cloud servers. Only you and your authorized team can access it.'
    },
    {
      question: 'What support do you offer?',
      answer: 'We provide email and phone support, detailed documentation, video tutorials, and onboarding assistance to get you started.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium">
            <span className="hidden sm:inline">Limited Offer:</span> Get 20% off annual plans this month
            <Link href="/pricing" className="ml-2 underline font-semibold hover:text-emerald-100">
              Learn more →
            </Link>
          </p>
        </div>
      </div>

      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8 animate-slide-down">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Trusted by 200+ Nigerian Distributors
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight tracking-tight">
                Stop Losing Money to Unreturned Empties & Bad Debt
              </h1>
              
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                The complete control system for Nigerian FMCG distributors. 
                Track empties, control credit, prevent fraud, and grow profits—all from one platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">
                    Start Free 14-Day Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-2 hover:bg-neutral-50">
                    See How It Works
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-neutral-600 pt-4">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Setup in 5 minutes
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Right Image/Mockup */}
            <div className="relative animate-fade-in">
              <div className="relative bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-[4/3] bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="text-center p-8">
                    <BarChart3 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
                    <p className="text-neutral-600 font-medium">Dashboard Preview</p>
                    <p className="text-sm text-neutral-500 mt-2">Real-time business analytics</p>
                  </div>
                </div>
              </div>
              {/* Floating stat cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
                <div className="text-sm text-neutral-600">Revenue This Month</div>
                <div className="text-2xl font-bold text-emerald-600">₦2.4M</div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
                <div className="text-sm text-neutral-600">Orders Today</div>
                <div className="text-2xl font-bold text-emerald-600">47</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{benefit.stat}</div>
                <div className="text-sm font-medium text-neutral-700">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-down">
            <Badge variant="outline" className="mb-4 border-red-200 text-red-700">The Hard Truth</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
              These Problems Cost You Millions Every Year
            </h2>
            <p className="text-lg text-neutral-600">
              Sound familiar? You're not alone. But there's a better way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto animate-fade-in">
            <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Unreturned Empties</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Losing ₦300K–₦1M monthly to bottles that never come back. No tracking means retailers keep your valuable empties.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Credit Abuse</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Retailers delay payments and exceed limits. Bad debt is killing your cash flow with no real-time visibility.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Sales Rep Fraud</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Unverified deliveries, missing cash, and fake receipts. Manual systems make it too easy to steal from you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">No Visibility</h3>
                <p className="text-neutral-600 leading-relaxed">
                  You find out about problems days or weeks later. Manual books can't give you the control you need.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-down">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
              Everything You Need to Control Your Distribution
            </h2>
            <p className="text-lg text-neutral-600">
              Built specifically for Nigerian FMCG distributors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fade-in">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-neutral-200 hover:border-emerald-200 transition-all hover:shadow-lg group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button size="lg" className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                See All Features & Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-down">
            <Badge className="mb-4 bg-teal-100 text-teal-700 border-0">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-lg text-neutral-600">
              From signup to success in less than a day
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto animate-fade-in">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="border-2 border-neutral-200 hover:border-emerald-200 transition-all h-full">
                  <CardContent className="p-8">
                    <div className="text-6xl font-bold text-emerald-100 mb-4">{step.number}</div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-emerald-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-down">
            <Badge className="mb-4 bg-amber-100 text-amber-700 border-0">Success Stories</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
              Trusted by Nigerian Distributors
            </h2>
            <p className="text-lg text-neutral-600">
              See how businesses like yours save money and grow profits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fade-in">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 border-neutral-200 hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-neutral-700 mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-bold text-neutral-900">{testimonial.name}</p>
                    <p className="text-sm text-neutral-600">{testimonial.business}</p>
                    <p className="text-xs text-neutral-500 mt-1">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-down">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-0">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-neutral-600">
              Everything you need to know about DistributionFlow
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 border-neutral-200 hover:border-emerald-200 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-3 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    {faq.question}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-2">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-down">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Ready to Take Control of Your Distribution Business?
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              Join 200+ distributors who have taken control of their business. 
              Start your free trial now—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg bg-white text-emerald-600 hover:bg-emerald-50 shadow-xl">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-14 px-10 text-lg border-2 border-white text-white hover:bg-white/10"
                >
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm pt-8">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                No credit card needed
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Cancel anytime
              </span>
            </div>

            <p className="text-emerald-100 pt-4">
              Questions? <a href="mailto:support@distributionflow.com" className="underline font-semibold hover:text-white">
                Contact our team
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DistributionFlow</span>
              </div>
              <p className="text-sm leading-relaxed">
                The complete control system for Nigerian FMCG distributors.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2026 DistributionFlow. All rights reserved. Built for Nigerian FMCG Distributors.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <a href="#" className="hover:text-white transition-colors">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
