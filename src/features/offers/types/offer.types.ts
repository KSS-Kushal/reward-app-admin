export interface Offer {
  id: string
  merchantId: string
  title: string
  description: string
  couponCode: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface OfferRequest {
  id?: string
  title: string
  description: string
  couponCode: string | null
  expiresAt: string | null
  active: boolean
}
