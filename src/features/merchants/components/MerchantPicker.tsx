import { Check, ChevronsUpDown, Loader2, Store } from 'lucide-react'
import { useState } from 'react'
import { ImagePreview } from '@/components/common/ImagePreview'
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
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { MAX_PAGE_SIZE } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useMerchant, useMerchants } from '../api/queries'

interface MerchantPickerProps {
  value: string | null | undefined
  onChange: (merchantId: string | null) => void
  id?: string
  className?: string
  placeholder?: string
  'aria-invalid'?: boolean
}

/** Store selector with server-side search (`GET /admin/merchants?q=`), so it scales past one page of stores. */
export function MerchantPicker({
  value,
  onChange,
  id,
  className,
  placeholder = 'Select a merchant',
  'aria-invalid': ariaInvalid,
}: MerchantPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 250)
  const list = useMerchants({ q, limit: MAX_PAGE_SIZE }, open)
  const selected = useMerchant(value ?? undefined)

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
          className={cn(
            'w-full justify-between font-normal sm:w-72',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Store className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{value ? (selected.data?.name ?? value) : placeholder}</span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search stores…" value={search} onValueChange={setSearch} />
          <CommandList>
            {list.isFetching && !list.data ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : (
              <CommandEmpty>{list.isError ? 'Unable to load stores.' : 'No stores found.'}</CommandEmpty>
            )}
            <CommandGroup>
              {list.data?.items.map((merchant) => (
                <CommandItem
                  key={merchant.id}
                  value={merchant.id}
                  onSelect={() => {
                    onChange(merchant.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('size-4', merchant.id === value ? 'opacity-100' : 'opacity-0')} />
                  <ImagePreview src={merchant.logoUrl} alt="" className="size-6" fit="contain" />
                  <span className="truncate">{merchant.name}</span>
                  {!merchant.active && (
                    <span className="ml-auto text-xs text-muted-foreground">Inactive</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
