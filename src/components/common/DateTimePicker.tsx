import { format, isValid, parseISO } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  /** ISO-8601 UTC string, or null. */
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  id?: string
  disabled?: boolean
  clearable?: boolean
  'aria-invalid'?: boolean
}

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

/**
 * Picks a date and time in the admin's local time zone and emits the instant as UTC ISO-8601
 * (`toISOString`), which is what the API expects.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  id,
  disabled,
  clearable = true,
  'aria-invalid': ariaInvalid,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const date = parse(value)
  const time = date ? format(date, 'HH:mm') : '00:00'

  const emit = (day: Date, hhmm: string) => {
    const [hours, minutes] = hhmm.split(':').map(Number)
    const next = new Date(day)
    next.setHours(hours || 0, minutes || 0, 0, 0)
    onChange(next.toISOString())
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn('flex-1 justify-start font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon />
            {date ? format(date, 'd MMM yyyy, h:mm a') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            defaultMonth={date ?? undefined}
            onSelect={(day) => day && emit(day, time)}
            captionLayout="dropdown"
          />
          <div className="flex items-center gap-2 border-t p-3">
            <Label htmlFor={`${id ?? 'datetime'}-time`} className="text-sm text-muted-foreground">
              Time
            </Label>
            <Input
              id={`${id ?? 'datetime'}-time`}
              type="time"
              value={time}
              onChange={(event) => emit(date ?? new Date(), event.target.value || '00:00')}
              className="w-32"
            />
            <span className="ml-auto text-xs text-muted-foreground">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && date && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          aria-label="Clear date"
        >
          <X />
        </Button>
      )}
    </div>
  )
}
