'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Package } from 'lucide-react'
import { useState } from 'react'

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <nav className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 group-hover:bg-emerald-700 transition-colors shadow-md">
            <Package className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">DistributionFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link href="/#features" className="text-sm font-medium text-neutral-700 hover:text-emerald-600 transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-neutral-700 hover:text-emerald-600 transition-colors">
            Pricing
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-neutral-700 hover:text-emerald-600 transition-colors">
            How It Works
          </Link>
          <Link href="/about" className="text-sm font-medium text-neutral-700 hover:text-emerald-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-neutral-700 hover:text-emerald-600 transition-colors">
            Contact
          </Link>
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hover:text-emerald-600 h-11 px-5">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 shadow-md">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-neutral-700" />
          ) : (
            <Menu className="h-6 w-6 text-neutral-700" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg animate-slide-down">
          <div className="container mx-auto px-4 py-6 space-y-1">
            <Link
              href="/#features"
              className="block py-3 px-4 text-base font-medium text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block py-3 px-4 text-base font-medium text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#how-it-works"
              className="block py-3 px-4 text-base font-medium text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="block py-3 px-4 text-base font-medium text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block py-3 px-4 text-base font-medium text-neutral-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-4 space-y-3 border-t mt-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full h-12 text-base border-2">
                  Login
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-md">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
