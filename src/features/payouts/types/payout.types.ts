import type { PageParams } from '@/lib/api/types'

export const PAYOUT_STATUSES = ['pending', 'completed', 'failed'] as const
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]

export interface Payout {
  id: string
  userId: string
  optionId: string
  coins: number
  accountDetails: string | null
  status: PayoutStatus
  /** Our reference, `PAYOUT-…`. */
  reference: string
  /** The bank/provider reference (e.g. UTR) entered on completion. */
  providerReference: string | null
  failureReason: string | null
  createdAt: string
  processedAt: string | null
}

export interface PayoutListParams extends PageParams {
  status?: PayoutStatus | ''
}
