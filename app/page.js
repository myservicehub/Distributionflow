import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, TrendingUp, Users, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold text-gray-900">DistributionFlow</span>
        </div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Streamline Your FMCG Distribution Business
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Manage debt, track inventory, process orders, and grow your distribution business with ease.
        </p>
        <div className="space-x-4">
          <Link href="/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Retailer Management</h3>
            <p className="text-gray-600">Track credit limits, manage accounts, and monitor debt aging.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Inventory Control</h3>
            <p className="text-gray-600">Real-time stock tracking with automatic deductions and alerts.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TrendingUp className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sales Analytics</h3>
            <p className="text-gray-600">Track performance by rep, product, and retailer.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <FileText className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Debt Management</h3>
            <p className="text-gray-600">Automated credit control with aging reports.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2025 DistributionFlow. Built for Nigerian FMCG Distributors.</p>
      </footer>
    </div>
  )
}
