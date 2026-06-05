'use client'

import { useState } from 'react'
import PublicNav from '@/components/PublicNav'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Package, Search, Book, Video, MessageCircle, HelpCircle, Mail, Phone, Clock, ExternalLink } from 'lucide-react'

export default function SupportPage() {
  const helpTopics = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of setting up your account and first orders',
      articles: [
        { 
          title: 'How to create your first order',
          content: 'Navigate to Dashboard → Orders → Click "New Order". Select the retailer, add products with quantities, set delivery date, and click "Create Order". Orders can be marked as walk-in or field sales.'
        },
        { 
          title: 'Adding retailers to your system',
          content: 'Go to Dashboard → Retailers → Click "Add Retailer". Enter business name, contact details, address, credit limit, and payment terms. Assign a sales representative if needed.'
        },
        { 
          title: 'Setting up your product catalog',
          content: 'Navigate to Dashboard → Products → Click "Add Product". Enter product name, SKU, category, unit price, and initial stock quantity. Link to empty bottle items if applicable.'
        },
        { 
          title: 'Inviting your team members',
          content: 'Go to Settings → Staff → Click "Add Staff Member". Enter their name, email, and assign a role (Admin, Manager, Sales Rep, or Warehouse). They\'ll receive an email invitation with login credentials.'
        }
      ]
    },
    {
      icon: Package,
      title: 'Empty Bottle Management',
      description: 'Track and manage returnable empties effectively',
      articles: [
        { 
          title: 'Setting up empty items',
          content: 'Go to Dashboard → Empty Items → Click "Add Empty Item". Enter the item name (e.g., "330ml Glass Bottle") and deposit value. The system will automatically track inventory.'
        },
        { 
          title: 'Recording manufacturer supply',
          content: 'Navigate to Dashboard → Manufacturer Supply → Click "Record Supply". Select the empty item type, enter quantity received from manufacturer, add notes if needed, and submit.'
        },
        { 
          title: 'Processing empty returns',
          content: 'Go to Dashboard → Empty Returns → Select the retailer → Choose empty item type → Enter quantity returned → Confirm. The retailer\'s empty balance will be updated automatically.'
        },
        { 
          title: 'Running reconciliation reports',
          content: 'Dashboard → Reports → Empty Reconciliation. View total empties issued, returned, and outstanding by retailer. Export to Excel for record-keeping.'
        }
      ]
    },
    {
      icon: MessageCircle,
      title: 'Orders & Deliveries',
      description: 'Managing orders from creation to delivery',
      articles: [
        { 
          title: 'Creating walk-in and field orders',
          content: 'Walk-in orders: Created at your office for customers who visit. Field orders: Created by sales reps on the go. Both use the same "New Order" button - just select the appropriate order type.'
        },
        { 
          title: 'Confirming deliveries',
          content: 'Go to Orders → Click on pending order → Review details → Click "Confirm Delivery". Stock will be automatically deducted and empty bottles will be issued to the retailer.'
        },
        { 
          title: 'Handling order cancellations',
          content: 'Navigate to Orders → Select the order → Click "Cancel Order". Provide a reason for cancellation. Cancelled orders don\'t affect stock or empty balances.'
        },
        { 
          title: 'Viewing order history',
          content: 'Dashboard → Orders → Use filters to view by date range, retailer, status, or sales rep. Click any order to see full details including products, amounts, and delivery status.'
        }
      ]
    },
    {
      icon: HelpCircle,
      title: 'Payments & Credit',
      description: 'Tracking payments and managing credit limits',
      articles: [
        { 
          title: 'Recording customer payments',
          content: 'Dashboard → Payments → Click "Record Payment" → Select retailer → Enter amount and payment method (Cash, Bank Transfer, Cheque) → Add reference number → Submit. Balance updates automatically.'
        },
        { 
          title: 'Setting credit limits',
          content: 'Go to Retailers → Select retailer → Click Edit → Set "Credit Limit" field. The system will alert you when creating orders that would exceed this limit.'
        },
        { 
          title: 'Understanding debt aging',
          content: 'Dashboard → Reports → Debt Aging Report. View customer balances categorized by age: 0-30 days, 31-60 days, 61-90 days, and 90+ days. Helps prioritize collection efforts.'
        },
        { 
          title: 'Generating payment reports',
          content: 'Reports → Payment History → Select date range → Filter by retailer or payment method → Click "Export" to download Excel or PDF. Includes all payment transactions.'
        }
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
      <PublicNav />

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
              <Card key={index} className="border-2 hover:border-blue-200 transition-all">
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
                  <Accordion type="single" collapsible className="w-full">
                    {topic.articles.map((article, i) => (
                      <AccordionItem key={i} value={`item-${i}`}>
                        <AccordionTrigger className="text-left text-sm text-blue-600 hover:text-blue-700">
                          {article.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-600">
                          {article.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">Still Need Help?</h2>
            <p className="text-xl text-blue-100 mb-12 text-center max-w-2xl mx-auto">
              Our support team is available 24/7 to help you succeed.
            </p>
            
            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Email Support */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Email Support</h3>
                  <a 
                    href="mailto:support@distribution-flow.com" 
                    className="text-blue-100 hover:text-white transition-colors text-sm break-all"
                  >
                    support@distribution-flow.com
                  </a>
                  <p className="text-blue-100 text-xs mt-3">
                    Response within 2 hours
                  </p>
                </CardContent>
              </Card>

              {/* Phone Support */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Phone & WhatsApp</h3>
                  <a 
                    href="tel:+2348141831420" 
                    className="text-blue-100 hover:text-white transition-colors text-sm"
                  >
                    +234 814 183 1420
                  </a>
                  <div className="flex gap-2 justify-center mt-3">
                    <a 
                      href="tel:+2348141831420"
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                    >
                      Call
                    </a>
                    <a 
                      href="https://wa.me/2348141831420"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                    >
                      WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Support Hours</h3>
                  <p className="text-blue-100 text-sm mb-1">
                    24/7 Support
                  </p>
                  <p className="text-blue-100 text-xs mt-3">
                    Always here when you need us
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50">
                  <Mail className="w-5 h-5 mr-2" />
                  Send Us a Message
                </Button>
              </Link>
              <a 
                href="https://wa.me/2348141831420?text=Hi%2C%20I%20need%20help%20with%20DistributionFlow"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="text-white font-semibold mb-4">DistributionFlow</h4>
                <p className="text-sm">
                  Streamlining FMCG distribution with smart empty bottle tracking and order management.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="mailto:support@distribution-flow.com" className="hover:text-white transition-colors">
                      support@distribution-flow.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+2348141831420" className="hover:text-white transition-colors">
                      +234 814 183 1420
                    </a>
                  </li>
                  <li>Available 24/7</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-8 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} DistributionFlow. Built for Nigerian FMCG Distributors. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
