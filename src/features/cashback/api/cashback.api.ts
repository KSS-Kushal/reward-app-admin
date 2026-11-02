import { api } from '@/lib/api/client'

/** `subId` is the user's affiliate id reported by the network. */
export interface CashbackOrderRequest {
  subId: string
  merchantId: string
  orderRef: string
  orderAmount: number
  cashbackCoins: number
}

export interface CashbackRef {
  merchantId: string
  orderRef: string
}

/** All three are idempotent per (merchantId, orderRef). */
export const cashbackApi = {
  record: (body: CashbackOrderRequest) => api.post<null>('/admin/cashback/orders', body),
  confirm: (ref: CashbackRef) => api.post<null>('/admin/cashback/orders/confirm', ref),
  cancel: (ref: CashbackRef) => api.post<null>('/admin/cashback/orders/cancel', ref),
}
