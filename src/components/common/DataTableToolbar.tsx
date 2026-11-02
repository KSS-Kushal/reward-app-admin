import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface DataTableToolbarProps {
  children: ReactNode
  hasFilters?: boolean
  onClear?: () => void
  /** Right-aligned content (counts, view toggles). */
  end?: ReactNode
}

export function DataTableToolbar({ children, hasFilters, onClear, end }: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {children}
        {hasFilters && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="self-start sm:self-auto">
            <X /> Clear filters
          </Button>
        )}
      </div>
      {end}
    </div>
  )
}
