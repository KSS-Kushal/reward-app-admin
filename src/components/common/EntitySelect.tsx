import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface EntitySelectProps<T> {
  items: T[] | undefined
  value: string | null | undefined
  onChange: (value: string | null) => void
  getValue: (item: T) => string
  getLabel: (item: T) => string
  renderItem?: (item: T) => ReactNode
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  disabled?: boolean
  id?: string
  className?: string
  /** Lets the admin pick "none". */
  allowClear?: boolean
  'aria-invalid'?: boolean
}

/** Searchable select over a list of entities (categories, stores…). */
export function EntitySelect<T>({
  items,
  value,
  onChange,
  getValue,
  getLabel,
  renderItem,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'Nothing found.',
  isLoading,
  disabled,
  id,
  className,
  allowClear,
  'aria-invalid': ariaInvalid,
}: EntitySelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = items?.find((item) => getValue(item) === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selected ? getLabel(selected) : value || placeholder}</span>
          {isLoading ? (
            <Loader2 className="animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start">
        <Command
          filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading…' : emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear && value && (
                <CommandItem
                  value="__clear__ none"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="text-muted-foreground"
                >
                  Clear selection
                </CommandItem>
              )}
              {items?.map((item) => {
                const itemValue = getValue(item)
                return (
                  <CommandItem
                    key={itemValue}
                    value={`${getLabel(item)} ${itemValue}`}
                    onSelect={() => {
                      onChange(itemValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('size-4', itemValue === value ? 'opacity-100' : 'opacity-0')} />
                    {renderItem ? renderItem(item) : getLabel(item)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
