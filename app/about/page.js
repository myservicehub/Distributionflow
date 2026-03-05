import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, Target, Award, ArrowRight, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To empower Nigerian FMCG distributors with technology that eliminates losses and drives profitable growth.'
    },
    {
      icon: Users,
      title: 'Built for You',
      description: 'Designed specifically for the Nigerian distribution industry, understanding local challenges and workflows.'
    },
    {
      icon: Award,
      title: 'Proven Results',
      description: 'Our customers recover an average of ₦500,000 monthly from better empty bottle tracking and credit control.'
    }
  ]

  const milestones = [
    { year: '2023', event: 'Founded with a vision to modernize FMCG distribution' },
    { year: '2024', event: 'Launched MVP with 20 pilot distributors in Lagos' },
    { year: '2025', event: 'Expanded to 200+ distributors across Nigeria' },
    { year: '2026', event: 'Became the leading distribution management platform' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">DistributionFlow</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            About DistributionFlow
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We're on a mission to help Nigerian FMCG distributors stop losing money and start growing profitably.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-700 leading-relaxed mb-4">
                DistributionFlow was born from a simple observation: Nigerian FMCG distributors were losing millions of naira every year to unreturned empty bottles, credit abuse, and poor tracking systems.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                After working with dozens of beverage distributors across Lagos, Kano, and Port Harcourt, we saw the same problems everywhere. Business owners were working 12-hour days but couldn't tell you their real-time stock levels, which retailers owed money, or how many empties were outstanding.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Manual books and Excel sheets weren't cutting it anymore. The industry needed a proper system built specifically for Nigerian distribution challenges.
              </p>
              <p className="text-slate-700 leading-relaxed">
                So we built DistributionFlow - a complete control system that tracks everything from order to payment, with special focus on empty bottle lifecycle management and credit control. Today, we're proud to serve 200+ distributors who are saving money and growing their businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">What Drives Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <value.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 pt-4">
                    <p className="text-lg text-slate-700">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Distributors Choose Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Built for Nigeria</h3>
                  <p className="text-blue-100">Understands local business practices, empty bottle systems, and credit culture</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Proven ROI</h3>
                  <p className="text-blue-100">Customers recover losses within the first month of use</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Mobile-First</h3>
                  <p className="text-blue-100">Your sales reps can use it on any smartphone, anywhere</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Local Support</h3>
                  <p className="text-blue-100">Nigerian team that understands your business and speaks your language</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Ready to Transform Your Distribution Business?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join 200+ Nigerian distributors who have taken control of their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
        </div>
      </footer>
    </div>
  )
}
