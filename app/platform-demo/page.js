'use client'

import { useState } from 'react'
import PublicNav from '@/components/PublicNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle2, Users, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function RequestDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Send to contact API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          message: 'Demo request from platform demo page'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit demo request')
      }

      setSubmitted(true)
      toast.success('Demo request submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-neutral-50">
      <PublicNav />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
            See DistributionFlow in Action
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Schedule a personalized demo and discover how DistributionFlow can transform your distribution business
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* Benefits */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle>Personalized Walkthrough</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Get a customized demo tailored to your specific business needs and challenges
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Expert Guidance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Learn best practices from our distribution experts during your demo session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>ROI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Understand the potential impact on your operations and bottom line
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Your Demo</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Request Submitted!
                  </h3>
                  <p className="text-neutral-600">
                    We'll contact you within 24 hours to schedule your personalized demo.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      placeholder="Acme Distribution Ltd"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@acme.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Request Demo'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* What to Expect */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-8">
            What to Expect in Your Demo
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">1</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Discovery Call</h3>
                  <p className="text-sm text-neutral-600">
                    We'll learn about your business and specific requirements
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">2</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Live Demo</h3>
                  <p className="text-sm text-neutral-600">
                    See the platform in action with your use cases
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">3</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Q&A Session</h3>
                  <p className="text-sm text-neutral-600">
                    Get all your questions answered by our experts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
