import { api } from '@/lib/api/client'
import type { Offer, OfferRequest } from '../types/offer.types'

export const offerApi = {
  listForMerchant: (merchantId: string, signal?: AbortSignal) =>
    api.get<Offer[]>(`/admin/merchants/${encodeURIComponent(merchantId)}/offers`, undefined, { signal }),
  create: (merchantId: string, body: OfferRequest) =>
    api.post<Offer>(`/admin/merchants/${encodeURIComponent(merchantId)}/offers`, body),
  update: (id: string, body: OfferRequest) => api.put<Offer>(`/admin/offers/${encodeURIComponent(id)}`, body),
  remove: (id: string) => api.delete(`/admin/offers/${encodeURIComponent(id)}`),
}
