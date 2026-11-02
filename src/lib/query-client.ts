import { QueryClient } from '@tanstack/react-query'
import { toApiError } from '@/lib/api/errors'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors (404, 403, 422…) won't fix themselves; retry only network and server failures.
        retry: (failureCount, error) => {
          const { status } = toApiError(error)
          if (status >= 400 && status < 500) return false
          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
}
