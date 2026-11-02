import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS, type Page } from '@/lib/api/types'
import { formatNumber } from '@/lib/format'

interface PaginationProps {
  /** The API page (1-based `currentPage`). */
  page: Pick<Page<unknown>, 'currentPage' | 'totalPages' | 'totalItems' | 'limit' | 'items'> | undefined
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  disabled?: boolean
}

export function Pagination({ page, onPageChange, onLimitChange, disabled }: PaginationProps) {
  if (!page || page.totalItems === 0) return null
  const { currentPage, totalPages, totalItems, limit } = page
  const from = (currentPage - 1) * limit + 1
  const to = Math.min(totalItems, from + page.items.length - 1)
  const lastPage = Math.max(1, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-3 border-t px-1 pt-4 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{formatNumber(from)}</span>–
        <span className="font-medium text-foreground">{formatNumber(to)}</span> of{' '}
        <span className="font-medium text-foreground">{formatNumber(totalItems)}</span>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rows</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger size="sm" className="w-[72px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          Page {formatNumber(currentPage)} of {formatNumber(lastPage)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(1)}
            disabled={disabled || currentPage <= 1}
            aria-label="First page"
          >
            <ChevronFirst />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || currentPage >= lastPage}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(lastPage)}
            disabled={disabled || currentPage >= lastPage}
            aria-label="Last page"
          >
            <ChevronLast />
          </Button>
        </div>
      </div>
    </nav>
  )
}
