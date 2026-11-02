import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { RedeemOptionRequest } from '../types/redeem-option.types'
import { redeemOptionApi } from './redeem-option.api'

export const redeemOptionsKeys = { all: ['redeem-options'] as const }

export function useRedeemOptions() {
  return useQuery({
    queryKey: redeemOptionsKeys.all,
    queryFn: ({ signal }) => redeemOptionApi.list(signal),
    staleTime: 60_000,
  })
}

export function useCreateRedeemOption() {
  return useApiMutation({
    mutationFn: (body: RedeemOptionRequest) => redeemOptionApi.create(body),
    successMessage: 'Redeem option created successfully.',
    invalidate: [redeemOptionsKeys.all],
  })
}

export function useUpdateRedeemOption() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: RedeemOptionRequest }) => redeemOptionApi.update(id, body),
    successMessage: 'Redeem option updated successfully.',
    invalidate: [redeemOptionsKeys.all],
  })
}

export function useDeleteRedeemOption() {
  return useApiMutation({
    mutationFn: (id: string) => redeemOptionApi.remove(id),
    successMessage: 'Redeem option deleted successfully.',
    invalidate: [redeemOptionsKeys.all],
  })
}
