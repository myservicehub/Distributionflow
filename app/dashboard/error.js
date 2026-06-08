'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="p-4 bg-red-50 rounded-full">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Something went wrong
        </h2>
        <p className="text-sm text-neutral-500 max-w-md">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="mt-2">
        Try again
      </Button>
    </div>
  )
}
