import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateRangeFilterProps {
  /** yyyy-MM-dd or empty. */
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  idPrefix?: string
}

/** Two native date inputs; the API takes inclusive `from`/`to` days as yyyy-MM-dd. */
export function DateRangeFilter({ from, to, onChange, idPrefix = 'range' }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={`${idPrefix}-from`} className="text-sm text-muted-foreground">
        From
      </Label>
      <Input
        id={`${idPrefix}-from`}
        type="date"
        value={from}
        max={to || undefined}
        onChange={(event) => onChange({ from: event.target.value, to })}
        className="w-40"
      />
      <Label htmlFor={`${idPrefix}-to`} className="text-sm text-muted-foreground">
        to
      </Label>
      <Input
        id={`${idPrefix}-to`}
        type="date"
        value={to}
        min={from || undefined}
        onChange={(event) => onChange({ from, to: event.target.value })}
        className="w-40"
      />
    </div>
  )
}
