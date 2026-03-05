import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  TrendingUp, 
  Users, 
  FileText, 
  Check,
  Shield,
  Smartphone,
  BarChart3,
  AlertCircle,
  Clock,
  DollarSign,
  Truck,
  Star,
  ArrowRight
} from 'lucide-react'
import PublicNav from '@/components/PublicNav'

export default function Home() {
  const features = [
    {
      icon: Package,
      title: 'Empty Bottle Lifecycle',
      description: 'Track every bottle from manufacturer to retailer and back. Eliminate losses from unreturned empties.',
      badge: 'Popular'
    },
    {
      icon: DollarSign,
      title: 'Credit Control',
      description: 'Automated credit limits, aging reports, and payment tracking. Stop credit abuse immediately.',
      badge: null
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Know your sales, stock, and debt status at any moment. Make data-driven decisions.',
      badge: null
    },
    {
      icon: Users,
      title: 'Sales Rep Accountability',
      description: 'Track every transaction, delivery, and payment. Eliminate fraud and missing cash.',
      badge: null
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'Your sales reps use smartphones. Our app works perfectly on any device, anywhere.',
      badge: null
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Automated alerts for suspicious activities. Protect your business 24/7.',
      badge: 'Enterprise'
    }
  ]

  const benefits = [
    {
      stat: '₦500K+',
      label: 'Average Monthly Savings',
      description: 'From recovered empties and reduced fraud'
    },
    {
      stat: '85%',
      label: 'Faster Order Processing',
      description: 'No more manual books and Excel sheets'
    },
    {
      stat: '24/7',
      label: 'Business Visibility',
      description: 'Check your business from anywhere, anytime'
    }
  ]

  const testimonials = [
    {
      name: 'Chidi Okafor',
      business: 'Okafor Beverages Ltd, Lagos',
      quote: 'We recovered over ₦800,000 in unreturned empties in just 3 months. This system paid for itself immediately.',
      rating: 5
    },
    {
      name: 'Amina Hassan',
      business: 'Hassan Distributors, Kano',
      quote: 'Credit control was our biggest problem. Now we automatically block orders when limits are exceeded. Game changer!',
      rating: 5
    },
    {
      name: 'David Eze',
      business: 'Eze & Sons Distribution, Enugu',
      quote: 'My sales reps can no longer manipulate records. Everything is tracked automatically. My stress has reduced by 90%.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100 text-base px-4 py-2">
            🎉 Trusted by 200+ Nigerian Distributors
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Stop Losing Money to<br />
            <span className="text-blue-600">Unreturned Empties</span> and<br />
            <span className="text-blue-600">Bad Debt</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The complete control system for Nigerian FMCG distributors. 
            Track empties, control credit, prevent fraud, and grow your profits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              No credit card required
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Setup in 5 minutes
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-red-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="destructive" className="mb-4">The Hard Truth</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                These Problems Are Costing You Millions
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Unreturned Empty Bottles</CardTitle>
                      <p className="text-slate-600 font-normal">
                        You're losing <strong>₦300,000 - ₦1,000,000 monthly</strong> to empties that never come back.
                        No proper tracking means retailers keep your valuable empties.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Credit Abuse</CardTitle>
                      <p className="text-slate-600 font-normal">
                        Retailers delay payments, exceed limits, and you have no real-time visibility.
                        <strong> Bad debt is killing your cash flow.</strong>
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Sales Rep Fraud</CardTitle>
                      <p className="text-slate-600 font-normal">
                        Unverified deliveries, missing cash, fake receipts. 
                        <strong> Manual systems make it easy to steal.</strong>
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">No Real-Time Visibility</CardTitle>
                      <p className="text-slate-600 font-normal">
                        You find out about problems <strong>days or weeks later</strong> when it's too late.
                        Manual books can't give you real-time control.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-slate-700">
                <strong>Sound familiar?</strong> You're not alone. But there's a solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-700">Proven Results</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Real Impact on Your Bottom Line
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center border-2 hover:border-blue-200 transition-all">
                  <CardHeader>
                    <div className="text-5xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                    <CardTitle className="text-xl mb-2">{benefit.label}</CardTitle>
                    <p className="text-slate-600 font-normal">{benefit.description}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Everything You Need to Control Your Distribution
              </h2>
              <p className="text-xl text-slate-600">
                Built specifically for Nigerian FMCG distributors
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      {feature.badge && (
                        <Badge className="bg-blue-600">{feature.badge}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <p className="text-slate-600 font-normal leading-relaxed">
                      {feature.description}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/pricing">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  See All Features & Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4">Success Stories</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Trusted by Nigerian Distributors
              </h2>
              <p className="text-xl text-slate-600">
                See how businesses like yours are saving money and growing profits
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.business}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Start Saving Money Today
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join 200+ distributors who have taken control of their business. 
              Start your free trial now—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-slate-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <p className="text-blue-100">
              Questions? <a href="mailto:support@distributionflow.com" className="underline font-semibold">Contact our team</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">DistributionFlow</span>
              </div>
              <p className="text-sm">
                The complete control system for Nigerian FMCG distributors.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#testimonials" className="hover:text-white">Testimonials</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
