import type { PageParams } from '@/lib/api/types'

export const CLAIM_STATUSES = ['pending', 'completed', 'expired'] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]
export const CLAIM_SOURCES = ['checkIn', 'spinWheel', 'scratchCard'] as const
export type ClaimSource = (typeof CLAIM_SOURCES)[number]

/** A check-in / spin / scratch prize waiting for (or credited after) a rewarded ad. */
export interface RewardClaim {
  claimId: string
  user: { id: string; name: string; email: string } | null
  source: ClaimSource
  coins: number
  status: ClaimStatus
  adVerified: boolean
  /** admob | unity | manual | disabled */
  adNetwork: string | null
  adUnitId: string | null
  placement: string | null
  adTransactionId: string | null
  /** How often the app got 409 AD_NOT_VERIFIED for this claim. */
  notVerifiedAttempts: number
  createdAt: string
  completedAt: string | null
  expiresAt: string
  transactionId: string | null
  /** Admin who credited it manually. */
  completedBy: string | null
  manualReason: string | null
}

export interface RewardClaimListParams extends PageParams {
  userId?: string
  status?: ClaimStatus | ''
  source?: ClaimSource | ''
  adVerified?: 'true' | 'false' | ''
  /** yyyy-MM-dd, inclusive, by creation day. */
  from?: string
  to?: string
}

/** Manual credit works for pending claims and expired ones created in the last 7 days. */
export const MANUAL_CREDIT_MAX_AGE_DAYS = 7
