import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { Merchant, MerchantListParams, MerchantRequest } from '../types/merchant.types'

const path = (id: string) => `/admin/merchants/${encodeURIComponent(id)}`

export const merchantApi = {
  list: (params: MerchantListParams, signal?: AbortSignal) =>
    api.get<Page<Merchant>>('/admin/merchants', params, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<Merchant>(path(id), undefined, { signal }),
  create: (body: MerchantRequest) => api.post<Merchant>('/admin/merchants', body),
  update: (id: string, body: MerchantRequest) => api.put<Merchant>(path(id), body),
  /** Also deletes the store's offers and products. */
  remove: (id: string) => api.delete(path(id)),
}
