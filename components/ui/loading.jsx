import { cn } from '@/lib/utils'

/**
 * Page-level loading indicator
 * Used in layouts, Suspense fallbacks, and full-page loading states
 */
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"
          role="status"
          aria-label={message}
        />
        <p className="mt-4 text-neutral-600 text-sm">{message}</p>
      </div>
    </div>
  )
}

/**
 * Section-level loading skeleton
 * Used inside cards, tables, or content areas
 */
export function SectionLoader({ rows = 5, className }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Card skeleton for KPI/stat cards
 * Matches the structure of dashboard KPI cards
 */
export function CardLoader({ className }) {
  return (
    <div className={cn("bg-white rounded-xl border-2 border-neutral-200 p-6", className)} role="status" aria-label="Loading card">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-6 w-16 bg-neutral-100 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-24 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Loading card data...</span>
    </div>
  )
}

/**
 * Table skeleton loader
 * Mimics table structure with header and rows
 */
export function TableLoader({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn("w-full", className)} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-neutral-200 mb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-5 bg-neutral-100 rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-10 bg-neutral-50 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading table data...</span>
    </div>
  )
}

/**
 * Inline loading spinner
 * Used in buttons, small indicators, inline states
 */
export function InlineLoader({ className, size = 'sm' }) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-current',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Button loading state
 * Replaces button content while loading
 */
export function ButtonLoader({ children, loading, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center gap-2">
          <InlineLoader size="sm" />
          <span>{children || 'Loading...'}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
