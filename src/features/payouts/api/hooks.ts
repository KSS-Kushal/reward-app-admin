import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { toApiError } from '@/lib/api/errors'
import type { PayoutListParams } from '../types/payout.types'
import { payoutApi } from './payout.api'

export const payoutsKeys = {
  all: ['payouts'] as const,
  list: (params: PayoutListParams) => [...payoutsKeys.all, 'list', params] as const,
}

export function usePayouts(params: PayoutListParams) {
  return useQuery({
    queryKey: payoutsKeys.list(params),
    queryFn: ({ signal }) => payoutApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

const alreadyProcessed = (error: unknown) =>
  toApiError(error).status === 409
    ? `The payout has already been processed. ${toApiError(error).message}`
    : null

// Settling changes the user's wallet totals too.
const invalidate = [payoutsKeys.all, ['users']]

export function useCompletePayout() {
  return useApiMutation({
    mutationFn: ({ id, providerReference }: { id: string; providerReference: string }) =>
      payoutApi.complete(id, providerReference),
    successMessage: 'Payout completed successfully.',
    invalidate,
    errorMessage: alreadyProcessed,
  })
}

export function useFailPayout() {
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => payoutApi.fail(id, reason),
    successMessage: 'Payout marked as failed. The coins were returned to the user.',
    invalidate,
    errorMessage: alreadyProcessed,
  })
}
