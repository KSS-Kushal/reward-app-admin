import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  /** The committed value (e.g. from the URL). */
  value: string
  /** Called with the debounced, trimmed value. */
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
}

/** Search box with local state and a debounced commit, so typing doesn't refetch on every key. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  maxLength = 100,
}: SearchInputProps) {
  const [text, setText] = useState(value)
  const debounced = useDebouncedValue(text)
  const lastCommitted = useRef(value)

  // External changes (clear filters, back/forward) replace the local text.
  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const trimmed = debounced.trim()
    if (trimmed !== lastCommitted.current) {
      lastCommitted.current = trimmed
      onChange(trimmed)
    }
  }, [debounced, onChange])

  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={maxLength}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
