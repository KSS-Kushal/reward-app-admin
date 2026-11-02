import type { ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { ColorPicker } from '@/components/common/ColorPicker'
import { DateTimePicker } from '@/components/common/DateTimePicker'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  className?: string
  disabled?: boolean
  required?: boolean
}

function FieldLabel({ label, required }: { label: ReactNode; required?: boolean }) {
  return (
    <FormLabel>
      {label}
      {required && (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      )}
    </FormLabel>
  )
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder,
  type = 'text',
  maxLength,
  autoComplete = 'off',
  inputClassName,
}: BaseFieldProps<T> & {
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'tel'
  maxLength?: number
  autoComplete?: string
  inputClassName?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ''}
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              autoComplete={autoComplete}
              className={inputClassName}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder,
  rows = 3,
  maxLength,
  showCount,
  textareaClassName,
}: BaseFieldProps<T> & {
  placeholder?: string
  rows?: number
  maxLength?: number
  showCount?: boolean
  textareaClassName?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const length = typeof field.value === 'string' ? field.value.length : 0
        return (
          <FormItem className={className}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel label={label} required={required} />
              {showCount && maxLength && (
                <span
                  className={cn(
                    'text-xs text-muted-foreground tabular-nums',
                    length > maxLength && 'text-destructive',
                  )}
                >
                  {length.toLocaleString()}/{maxLength.toLocaleString()}
                </span>
              )}
            </div>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ''}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                className={textareaClassName}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/** Number input bound to `number | null`; an empty box is null. */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder,
  min,
  max,
  step = 1,
  suffix,
}: BaseFieldProps<T> & {
  placeholder?: string
  min?: number
  max?: number
  step?: number | 'any'
  suffix?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <div className="relative">
            <FormControl>
              <Input
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                type="number"
                inputMode={step === 1 ? 'numeric' : 'decimal'}
                value={field.value ?? ''}
                onChange={(event) => {
                  const raw = event.target.value
                  field.onChange(raw === '' ? null : Number(raw))
                }}
                onWheel={(event) => event.currentTarget.blur()}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn('tabular-nums', suffix && 'pr-14')}
              />
            </FormControl>
            {suffix && (
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center justify-between gap-4 rounded-lg border p-3', className)}>
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
  options,
  placeholder = 'Select…',
}: BaseFieldProps<T> & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger className="w-full" onBlur={field.onBlur}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function DateTimeField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
  placeholder,
  clearable = true,
}: BaseFieldProps<T> & { placeholder?: string; clearable?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <FormControl>
            <DateTimePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              clearable={clearable}
              aria-invalid={Boolean(fieldState.error)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ColorField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  required,
}: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <FormControl>
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              aria-invalid={Boolean(fieldState.error)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
