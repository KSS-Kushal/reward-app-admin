import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string | null | undefined
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: boolean
}

const HEX = /^#[0-9A-Fa-f]{6}$/

/** Native colour swatch plus a #RRGGBB text field. */
export function ColorPicker({
  value,
  onChange,
  id,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
}: ColorPickerProps) {
  const [text, setText] = useState(value ?? '')
  const [synced, setSynced] = useState(value)
  // Adopt external changes (reset, picker) without an effect.
  if (value !== synced) {
    setSynced(value)
    setText(value ?? '')
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        type="color"
        value={value && HEX.test(value) ? value : '#000000'}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        disabled={disabled}
        aria-label="Pick colour"
        className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 disabled:cursor-not-allowed"
      />
      <Input
        id={id}
        value={text}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        placeholder="#RRGGBB"
        maxLength={7}
        className="font-mono uppercase"
        onChange={(event) => {
          let next = event.target.value.trim()
          if (next && !next.startsWith('#')) next = `#${next}`
          setText(next)
          onChange(next.toUpperCase())
        }}
      />
    </div>
  )
}
