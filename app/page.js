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
        <div className="max-w-5xl mx-auto text-center animate-slide-down">
          <Badge className="mb-6 bg-primary-100 text-primary-700 hover:bg-primary-100 text-base px-5 py-2 border border-primary-200 font-medium">
            Trusted by 200+ Nigerian Distributors
          </Badge>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-tight tracking-tight">
            Stop Losing Money to<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Unreturned Empties</span> and<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Bad Debt</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The complete control system for Nigerian FMCG distributors. 
            Track empties, control credit, prevent fraud, and grow your profits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-10 py-7 bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-neutral-300 hover:bg-neutral-50 hover:border-primary-400">
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success-600" />
              No credit card required
            </span>
            <span className="hidden sm:block text-neutral-400">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success-600" />
              Setup in 5 minutes
            </span>
            <span className="hidden sm:block text-neutral-400">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success-600" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-red-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-slide-down">
              <Badge variant="destructive" className="mb-4 font-medium">The Hard Truth</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                These Problems Are Costing You Millions
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
              <Card className="border-0 shadow-soft bg-white hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-3 text-neutral-900">Unreturned Empty Bottles</CardTitle>
                      <p className="text-neutral-600 font-normal leading-relaxed">
                        You're losing <strong className="text-neutral-900">₦300,000 - ₦1,000,000 monthly</strong> to empties that never come back.
                        No proper tracking means retailers keep your valuable empties.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-soft bg-white hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-3 text-neutral-900">Credit Abuse</CardTitle>
                      <p className="text-neutral-600 font-normal leading-relaxed">
                        Retailers delay payments, exceed limits, and you have no real-time visibility.
                        <strong className="text-neutral-900"> Bad debt is killing your cash flow.</strong>
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-soft bg-white hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-3 text-neutral-900">Sales Rep Fraud</CardTitle>
                      <p className="text-neutral-600 font-normal leading-relaxed">
                        Unverified deliveries, missing cash, fake receipts. 
                        <strong className="text-neutral-900"> Manual systems make it easy to steal.</strong>
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-soft bg-white hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-3 text-neutral-900">No Real-Time Visibility</CardTitle>
                      <p className="text-neutral-600 font-normal leading-relaxed">
                        You find out about problems <strong className="text-neutral-900">days or weeks later</strong> when it's too late.
                        Manual books can't give you real-time control.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-neutral-700">
                <strong className="text-neutral-900">Sound familiar?</strong> You're not alone. But there's a solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-slide-down">
              <Badge className="mb-4 bg-success-100 text-success-700 border border-success-200 font-medium">Proven Results</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Real Impact on Your Bottom Line
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16 animate-scale-in">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center border-0 shadow-soft hover:shadow-medium transition-all duration-300">
                  <CardHeader>
                    <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">{benefit.stat}</div>
                    <CardTitle className="text-xl mb-3 text-neutral-900">{benefit.label}</CardTitle>
                    <p className="text-neutral-600 font-normal">{benefit.description}</p>
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
            <div className="text-center mb-12 animate-slide-down">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Everything You Need to Control Your Distribution
              </h2>
              <p className="text-xl text-neutral-600">
                Built specifically for Nigerian FMCG distributors
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                        <feature.icon className="w-7 h-7 text-primary-600" />
                      </div>
                      {feature.badge && (
                        <Badge className="bg-gradient-primary text-white border-0 font-medium">{feature.badge}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-3 text-neutral-900">{feature.title}</CardTitle>
                    <p className="text-neutral-600 font-normal leading-relaxed">
                      {feature.description}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/pricing">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white shadow-glow-primary px-10 py-7 text-lg">
                  See All Features & Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-neutral-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-slide-down">
              <Badge className="mb-4 border border-neutral-200 font-medium">Success Stories</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Trusted by Nigerian Distributors
              </h2>
              <p className="text-xl text-neutral-600">
                See how businesses like yours are saving money and growing profits
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-neutral-700 mb-4 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-neutral-900">{testimonial.name}</p>
                      <p className="text-sm text-neutral-600">{testimonial.business}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-primary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-slide-down">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Start Saving Money Today
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join 200+ distributors who have taken control of their business. 
              Start your free trial now—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-10 py-7 bg-white text-primary-600 hover:bg-neutral-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-7 border-2 border-white text-white hover:bg-white/10"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <p className="text-primary-100">
              Questions? <a href="mailto:support@distributionflow.com" className="underline font-semibold hover:text-white transition-colors">Contact our team</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-primary-500" />
                <span className="text-xl font-bold text-white">DistributionFlow</span>
              </div>
              <p className="text-sm leading-relaxed">
                The complete control system for Nigerian FMCG distributors.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 pt-8 text-center text-sm">
            <p>&copy; 2026 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
