import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { RewardClaim, RewardClaimListParams } from '../types/reward-claim.types'

export const rewardClaimApi = {
  list: (params: RewardClaimListParams, signal?: AbortSignal) =>
    api.get<Page<RewardClaim>>('/admin/reward-claims', params, { signal }),
  /** Credits without ad verification. 409 CLAIM_ALREADY_COMPLETED, 422 CLAIM_TOO_OLD, 404 CLAIM_NOT_FOUND. */
  completeManually: (claimId: string, reason: string) =>
    api.post<RewardClaim>(`/admin/reward-claims/${encodeURIComponent(claimId)}/complete`, { reason }),
}
