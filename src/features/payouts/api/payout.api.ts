import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { Payout, PayoutListParams } from '../types/payout.types'

const path = (id: string) => `/admin/payouts/${encodeURIComponent(id)}`

export const payoutApi = {
  /** Oldest first. */
  list: (params: PayoutListParams, signal?: AbortSignal) =>
    api.get<Page<Payout>>('/admin/payouts', params, { signal }),
  /** 409 when the payout is no longer pending. */
  complete: (id: string, providerReference: string) =>
    api.post<Payout>(`${path(id)}/complete`, { providerReference }),
  /** Returns the coins to the user. 409 when the payout is no longer pending. */
  fail: (id: string, reason: string) => api.post<Payout>(`${path(id)}/fail`, { reason }),
}
