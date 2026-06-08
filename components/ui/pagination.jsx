import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null

  const pages = []
  const showEllipsisStart = currentPage > 3
  const showEllipsisEnd = currentPage < totalPages - 2

  // Always show first, last, and up to 2 around current
  if (showEllipsisStart) {
    pages.push(1, '...')
  } else {
    for (let i = 1; i < currentPage; i++) {
      pages.push(i)
    }
  }

  // Current page and neighbors
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // End pages
  if (showEllipsisEnd) {
    pages.push('...', totalPages)
  } else {
    for (let i = currentPage + 2; i <= totalPages; i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }
  }

  // Deduplicate and ensure proper order
  const uniquePages = [...new Set(pages)].filter((p, i, arr) => 
    arr.indexOf(p) === i
  )

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200">
      <p className="text-sm text-neutral-500">
        Showing {start}–{end} of {totalItems} results
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-3"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {uniquePages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-neutral-400">…</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 p-0 ${page === currentPage ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 px-3"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
