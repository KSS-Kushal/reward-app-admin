import {
  Ban,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  Archive,
  XCircle,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary'

const TONES: Record<Tone, string> = {
  success: 'border-success/30 bg-success/10 text-success dark:text-success',
  warning: 'border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-info/30 bg-info/10 text-info',
  primary: 'border-primary/30 bg-primary/10 text-primary',
}

/** Every known status, with its tone, icon and label. Icons + text mean status never relies on colour alone. */
const STATUSES: Record<string, { tone: Tone; icon: LucideIcon; label: string }> = {
  ACTIVE: { tone: 'success', icon: CheckCircle2, label: 'Active' },
  BANNED: { tone: 'danger', icon: Ban, label: 'Banned' },
  DRAFT: { tone: 'neutral', icon: CircleDashed, label: 'Draft' },
  PUBLISHED: { tone: 'success', icon: CheckCircle2, label: 'Published' },
  ARCHIVED: { tone: 'warning', icon: Archive, label: 'Archived' },
  PENDING: { tone: 'warning', icon: Clock, label: 'Pending' },
  COMPLETED: { tone: 'success', icon: CheckCircle2, label: 'Completed' },
  FAILED: { tone: 'danger', icon: XCircle, label: 'Failed' },
  ENABLED: { tone: 'success', icon: CheckCircle2, label: 'Enabled' },
  DISABLED: { tone: 'neutral', icon: Circle, label: 'Disabled' },
  INACTIVE: { tone: 'neutral', icon: Circle, label: 'Inactive' },
  EXPIRED: { tone: 'danger', icon: Clock, label: 'Expired' },
  SCHEDULED: { tone: 'info', icon: Clock, label: 'Scheduled' },
  ADMIN: { tone: 'primary', icon: ShieldCheck, label: 'Admin' },
  USER: { tone: 'neutral', icon: Circle, label: 'User' },
}

interface StatusBadgeProps {
  /** Case-insensitive: `pending` and `PENDING` both work. */
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUSES[status.toUpperCase()] ?? { tone: 'neutral' as Tone, icon: Circle, label: status }
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[config.tone],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label ?? config.label}
    </span>
  )
}

/** Active/inactive style flag (`active`, `enabled`). */
export function BooleanBadge({
  value,
  trueLabel = 'Active',
  falseLabel = 'Inactive',
}: {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) {
  return <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} label={value ? trueLabel : falseLabel} />
}
