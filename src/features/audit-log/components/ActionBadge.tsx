import { cn } from '@/lib/utils'

const TONES: Record<string, string> = {
  CREATE: 'border-success/30 bg-success/10 text-success',
  CONFIRM: 'border-success/30 bg-success/10 text-success',
  COMPLETE: 'border-success/30 bg-success/10 text-success',
  UNBAN: 'border-success/30 bg-success/10 text-success',
  UPDATE: 'border-info/30 bg-info/10 text-info',
  ROLE: 'border-primary/30 bg-primary/10 text-primary',
  DELETE: 'border-destructive/30 bg-destructive/10 text-destructive',
  BAN: 'border-destructive/30 bg-destructive/10 text-destructive',
  FAIL: 'border-destructive/30 bg-destructive/10 text-destructive',
  CANCEL: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide',
        TONES[action] ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      {action}
    </span>
  )
}
