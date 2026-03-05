import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Package, Search, Book, Video, MessageCircle, HelpCircle } from 'lucide-react'

export default function SupportPage() {
  const helpTopics = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of setting up your account and first orders',
      articles: [
        'How to create your first order',
        'Adding retailers to your system',
        'Setting up your product catalog',
        'Inviting your team members'
      ]
    },
    {
      icon: Package,
      title: 'Empty Bottle Management',
      description: 'Track and manage returnable empties effectively',
      articles: [
        'Setting up empty items',
        'Recording manufacturer supply',
        'Processing empty returns',
        'Running reconciliation reports'
      ]
    },
    {
      icon: MessageCircle,
      title: 'Orders & Deliveries',
      description: 'Managing orders from creation to delivery',
      articles: [
        'Creating walk-in and field orders',
        'Confirming deliveries',
        'Handling order cancellations',
        'Viewing order history'
      ]
    },
    {
      icon: HelpCircle,
      title: 'Payments & Credit',
      description: 'Tracking payments and managing credit limits',
      articles: [
        'Recording customer payments',
        'Setting credit limits',
        'Understanding debt aging',
        'Generating payment reports'
      ]
    }
  ]

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to you.'
    },
    {
      question: 'Can I use this on my phone?',
      answer: 'Yes! DistributionFlow works on any device - smartphone, tablet, or computer. Your sales reps can use it in the field.'
    },
    {
      question: 'How do I add more users?',
      answer: 'Go to Settings → Team, click "Add Staff Member" and send them an invite. They\'ll receive an email to create their account.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data is preserved for 90 days after cancellation. You can export all your data anytime before that.'
    },
    {
      question: 'Do you offer training?',
      answer: 'Yes! All plans include video tutorials. Business and Enterprise plans get personalized onboarding sessions.'
    },
    {
      question: 'Can I track multiple warehouses?',
      answer: 'Multi-warehouse tracking is available on the Enterprise plan. Contact us to discuss your needs.'
    },
    {
      question: 'How secure is my data?',
      answer: 'We use bank-level encryption (SSL/TLS) and host on secure cloud servers. Your data is backed up daily.'
    },
    {
      question: 'Can I export my reports?',
      answer: 'Yes! All reports can be exported to Excel or PDF format for easy sharing and record-keeping.'
    }
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
            How Can We Help You?
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Search our help center or browse topics below
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                type="text" 
                placeholder="Search for help... (e.g., 'how to add products')" 
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Help Topics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Browse by Topic</h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            {helpTopics.map((topic, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <topic.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topic.articles.map((article, i) => (
                      <li key={i}>
                        <a href="#" className="text-blue-600 hover:underline text-sm">
                          → {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Video className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Video Tutorials</h2>
            <p className="text-lg text-slate-600 mb-8">
              Watch step-by-step video guides on using DistributionFlow
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Quick Start Guide</h3>
                  <p className="text-sm text-slate-600">Get started in 5 minutes</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Empty Bottle Tracking</h3>
                  <p className="text-sm text-slate-600">Master empty management</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Advanced Reports</h3>
                  <p className="text-sm text-slate-600">Generate powerful insights</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50">
                Contact Support
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Chat with Us
            </Button>
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
