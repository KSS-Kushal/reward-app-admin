import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/api/types'

type Patch<K extends string> = Partial<Record<K | 'page' | 'limit', string | number | null | undefined>>

/**
 * List state (filters, `page`, `limit`) kept in the URL so lists survive refresh, back/forward and sharing.
 * `page` is 1-based, exactly like the API. Changing a filter resets to page 1.
 */
export function useListParams<K extends string>(filterKeys: readonly K[], defaultLimit = DEFAULT_PAGE_SIZE) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () =>
      Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? ''])) as Record<K, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKeys is a constant list per page
    [searchParams],
  )
  const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1)
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(searchParams.get('limit'))) || defaultLimit),
  )

  const update = useCallback(
    (patch: Patch<K>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const touchesFilters = Object.keys(patch).some((key) => key !== 'page')
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          if (touchesFilters && !('page' in patch)) next.delete('page')
          if (next.get('page') === '1') next.delete('page')
          if (next.get('limit') === String(defaultLimit)) next.delete('limit')
          return next
        },
        { replace: !('page' in patch) },
      )
    },
    [setSearchParams, defaultLimit],
  )

  const clear = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        filterKeys.forEach((key) => next.delete(key))
        next.delete('page')
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKeys is a constant list per page
  }, [setSearchParams])

  const hasFilters = filterKeys.some((key) => Boolean(filters[key]))

  return { filters, page, limit, update, clear, hasFilters }
}
