import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export default function PrivacyPage() {
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

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                DistributionFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our distribution management platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li>Account information (name, email, phone number, company name)</li>
                <li>Business data (retailers, products, orders, payments, inventory)</li>
                <li>User profile information for team members</li>
                <li>Communication preferences and support requests</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (features used, time spent, actions taken)</li>
                <li>Log data (access times, error logs)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage your account</li>
                <li>Send important notices, updates, and security alerts</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect and prevent fraud or security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Storage and Security</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Your data is stored on secure cloud servers with industry-standard encryption (SSL/TLS). We implement appropriate technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Daily automated backups</li>
                <li>Secure data centers with 24/7 monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your data only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (hosting, payment processing, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain data processing activities</li>
              </ul>
              <p className="text-slate-700 leading-relaxed">
                To exercise these rights, contact us at privacy@distributionflow.ng
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We retain your information for as long as your account is active or as needed to provide services. After account cancellation, we retain data for 90 days to allow reactivation, then delete it unless required for legal or business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Children's Privacy</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. International Data Transfers</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Your data may be transferred to and processed in countries other than Nigeria. We ensure appropriate safeguards are in place to protect your information in compliance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes by email or through the platform. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data practices, contact us:
              </p>
              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="text-slate-700"><strong>Email:</strong> privacy@distributionflow.ng</p>
                <p className="text-slate-700"><strong>Phone:</strong> +234 800 DISTRO (347876)</p>
                <p className="text-slate-700"><strong>Address:</strong> Plot 123, Adeola Odeku Street, Victoria Island, Lagos, Nigeria</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
        </div>
      </footer>
    </div>
  )
}
