import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormActionsProps {
  submitLabel: string
  pending?: boolean
  onCancel?: () => void
  /** Disable submit (e.g. nothing changed). */
  disabled?: boolean
  children?: ReactNode
  className?: string
  sticky?: boolean
}

/** Cancel + submit buttons. Submit is disabled while pending to prevent duplicate submissions. */
export function FormActions({
  submitLabel,
  pending,
  onCancel,
  disabled,
  children,
  className,
  sticky,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end',
        sticky &&
          'sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6',
        className,
      )}
    >
      {children}
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={pending || disabled}>
        {pending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  )
}
