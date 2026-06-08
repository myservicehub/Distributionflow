'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'

export default function RootError({ error, reset }) {
  useEffect(() => {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, etc.)
      console.error('Application error:', error)
    } else {
      console.error('Application error:', error)
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
          <div className="p-6 bg-red-50 rounded-full">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-neutral-900">
              Oops! Something went wrong
            </h1>
            <p className="text-neutral-600 max-w-md">
              {error?.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
