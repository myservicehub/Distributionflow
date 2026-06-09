'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export const DATE_RANGES = [
  { label: 'Today',    value: 'today',  days: 0  },
  { label: '7 days',   value: '7d',     days: 7  },
  { label: '30 days',  value: '30d',    days: 30 },
  { label: '90 days',  value: '90d',    days: 90 },
  { label: 'All time', value: 'all',    days: null },
]

/**
 * Returns a JS Date representing the start of the selected range.
 * Returns null for 'all'.
 */
export function getDateRangeStart(value) {
  if (value === 'all') return null
  const d = new Date()
  if (value === 'today') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  const range = DATE_RANGES.find(r => r.value === value)
  if (!range) return null
  d.setDate(d.getDate() - range.days)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * DateRangeFilter — row of preset buttons
 *
 * Props:
 *   value        {string}   — active range value ('today','7d','30d','90d','all')
 *   onChange     {function} — called with new value string
 *   className    {string}   — optional extra classes for the wrapper
 */
export function DateRangeFilter({ value, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-neutral-400 flex-shrink-0 hidden sm:block" />
      <div className="flex gap-1 flex-wrap">
        {DATE_RANGES.map(range => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              value === range.value
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-emerald-300 hover:text-emerald-700'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  )
}
