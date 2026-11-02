import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface Option<V extends string = string> {
  value: V
  label: string
}

const ALL = '__all__'

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: readonly Option[]
  /** Label of the "no filter" choice. */
  allLabel: string
  label: string
  className?: string
  disabled?: boolean
}

/** A list filter. Selecting the "all" entry clears the filter (empty string). */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  label,
  className,
  disabled,
}: FilterSelectProps) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full sm:w-44', className)} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
