import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { RewardClaimListParams } from '../types/reward-claim.types'
import { rewardClaimApi } from './reward-claim.api'

export const rewardClaimsKeys = {
  all: ['reward-claims'] as const,
  list: (params: RewardClaimListParams) => [...rewardClaimsKeys.all, params] as const,
}

export function useRewardClaims(params: RewardClaimListParams) {
  return useQuery({
    queryKey: rewardClaimsKeys.list(params),
    queryFn: ({ signal }) => rewardClaimApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCompleteClaimManually() {
  return useApiMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason: string }) =>
      rewardClaimApi.completeManually(claimId, reason),
    successMessage: (claim) => `${claim.coins} coins credited to ${claim.user?.name ?? 'the user'}.`,
    // The credit changes the user's wallet and the ad stats.
    invalidate: [rewardClaimsKeys.all, ['users'], ['ads', 'stats']],
  })
}
