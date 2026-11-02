import { Coins } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCoins, formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

export function CoinsDisplay({
  value,
  className,
  icon = false,
}: {
  value: number | null | undefined
  className?: string
  icon?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      {icon && <Coins className="size-3.5 text-warning" aria-hidden />}
      {formatCoins(value)}
    </span>
  )
}

export function CurrencyDisplay({
  value,
  symbol,
  className,
}: {
  value: number | null | undefined
  symbol?: string
  className?: string
}) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(value, symbol)}</span>
}

/** Relative time with the exact local date in a tooltip. */
export function DateDisplay({
  value,
  mode = 'absolute',
}: {
  value: string | null | undefined
  mode?: 'absolute' | 'relative'
}) {
  if (!value) return <span className="text-muted-foreground">—</span>
  const absolute = formatDateTime(value)
  const relative = formatRelative(value)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={value} className="whitespace-nowrap tabular-nums">
          {mode === 'relative' ? relative : absolute}
        </time>
      </TooltipTrigger>
      <TooltipContent>{mode === 'relative' ? absolute : relative}</TooltipContent>
    </Tooltip>
  )
}

/** Label/value rows for detail cards. */
export function DetailList({
  items,
  className,
}: {
  items: { label: string; value: ReactNode }[]
  className?: string
}) {
  return (
    <dl className={cn('divide-y', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-xs', className)}>{children}</code>
}
