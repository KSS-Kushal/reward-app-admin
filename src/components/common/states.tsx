import { AlertTriangle, Inbox, Loader2, Lock, RefreshCw, SearchX, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Empty state for a filtered list: offers to clear filters. */
export function NoResults({ onClear, what = 'results' }: { onClear?: () => void; what?: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title={`No ${what} found`}
      description="Try changing your search or filters."
      action={
        onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )
      }
    />
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorState({ error, onRetry, title, className }: ErrorStateProps) {
  const apiError = toApiError(error)
  const forbidden = apiError.status === 403
  const notFound = apiError.status === 404
  const Icon = forbidden ? Lock : AlertTriangle
  const heading =
    title ??
    (forbidden
      ? "You don't have permission to view this"
      : notFound
        ? 'Not found'
        : 'Unable to load this data')

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <Icon className="size-8 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{heading}</p>
        <p className="max-w-md text-sm text-muted-foreground">{apiError.message}</p>
      </div>
      {onRetry && !forbidden && !notFound && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground', className)}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

/** Placeholder for a detail/edit page while it loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
