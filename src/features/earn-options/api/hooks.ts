import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { EarnOption, EarnOptionRequest } from '../types/earn-option.types'
import { earnOptionApi, earnOptionToRequest } from './earn-option.api'

export const earnOptionsKeys = { all: ['earn-options'] as const }

export function useEarnOptions() {
  return useQuery({ queryKey: earnOptionsKeys.all, queryFn: ({ signal }) => earnOptionApi.list(signal) })
}

export function useCreateEarnOption() {
  return useApiMutation({
    mutationFn: (body: EarnOptionRequest) => earnOptionApi.create(body),
    successMessage: 'Earn option created successfully.',
    invalidate: [earnOptionsKeys.all],
  })
}

export function useUpdateEarnOption() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: EarnOptionRequest }) => earnOptionApi.update(id, body),
    successMessage: 'Earn option updated successfully.',
    invalidate: [earnOptionsKeys.all],
  })
}

export function useDeleteEarnOption() {
  return useApiMutation({
    mutationFn: (id: string) => earnOptionApi.remove(id),
    successMessage: 'Earn option deleted successfully.',
    invalidate: [earnOptionsKeys.all],
  })
}

/**
 * Moves an option one place up or down by exchanging sort orders with its neighbour (`PUT` with the full
 * body, as the API requires). With equal sort orders only the moved option changes.
 */
export function useSwapEarnOptions() {
  return useApiMutation({
    mutationFn: async ({
      moving,
      neighbour,
      direction,
    }: {
      moving: EarnOption
      neighbour: EarnOption
      direction: 'up' | 'down'
    }) => {
      if (moving.sortOrder === neighbour.sortOrder) {
        const sortOrder = neighbour.sortOrder + (direction === 'up' ? -1 : 1)
        await earnOptionApi.update(moving.id, earnOptionToRequest(moving, { sortOrder }))
        return
      }
      await earnOptionApi.update(moving.id, earnOptionToRequest(moving, { sortOrder: neighbour.sortOrder }))
      await earnOptionApi.update(
        neighbour.id,
        earnOptionToRequest(neighbour, { sortOrder: moving.sortOrder }),
      )
    },
    successMessage: 'Order updated.',
    invalidate: [earnOptionsKeys.all],
  })
}
