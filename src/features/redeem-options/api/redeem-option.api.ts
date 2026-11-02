import { api } from '@/lib/api/client'
import type { RedeemOption, RedeemOptionRequest } from '../types/redeem-option.types'

const path = (id: string) => `/admin/redeem-options/${encodeURIComponent(id)}`

export const redeemOptionApi = {
  list: (signal?: AbortSignal) => api.get<RedeemOption[]>('/admin/redeem-options', undefined, { signal }),
  create: (body: RedeemOptionRequest) => api.post<RedeemOption>('/admin/redeem-options', body),
  update: (id: string, body: RedeemOptionRequest) => api.put<RedeemOption>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}
