import { Check, ChevronsUpDown, Loader2, UserRound, X } from 'lucide-react'
import { useState } from 'react'
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
import { useUser, useUsers } from '../api/queries'
import { UserAvatar } from './UserAvatar'

interface UserPickerProps {
  value: string | null | undefined
  onChange: (userId: string | null) => void
  id?: string
  className?: string
  placeholder?: string
}

/** User selector with server-side search by name, email or referral code (`GET /admin/users?q=`). */
export function UserPicker({ value, onChange, id, className, placeholder = 'All users' }: UserPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 250)
  const list = useUsers({ q, limit: MAX_PAGE_SIZE }, open)
  const selected = useUser(value ?? undefined)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between font-normal sm:w-60', !value && 'text-muted-foreground')}
          >
            <span className="flex min-w-0 items-center gap-2">
              <UserRound className="size-4 shrink-0 opacity-60" />
              <span className="truncate">
                {value ? (selected.data?.user.name ?? 'Loading…') : placeholder}
              </span>
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search name, email or code…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {list.isFetching && !list.data ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Searching…
                </div>
              ) : (
                <CommandEmpty>{list.isError ? 'Unable to load users.' : 'No users found.'}</CommandEmpty>
              )}
              <CommandGroup>
                {list.data?.items.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onChange(user.id)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('size-4', user.id === value ? 'opacity-100' : 'opacity-0')} />
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} className="size-6" />
                    <span className="min-w-0">
                      <span className="block truncate">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          aria-label="Clear user filter"
        >
          <X />
        </Button>
      )}
    </div>
  )
}
