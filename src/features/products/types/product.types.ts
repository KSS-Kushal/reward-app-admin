import type { SearchPageParams } from '@/lib/api/types'

/** Admin product view. `affiliateUrl` is the stored template; `tracksUser` is true when it contains `{subId}`. */
export interface Product {
  id: string
  merchantId: string
  name: string
  imageUrl: string | null
  price: number
  originalPrice: number | null
  currencySymbol: string
  affiliateUrl: string
  tracksUser: boolean
  rating: number | null
  rewardText: string | null
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ProductRequest {
  id?: string
  name: string
  imageUrl: string | null
  price: number
  originalPrice: number | null
  currencySymbol: string | null
  affiliateUrl: string
  rating: number | null
  rewardText: string | null
  active: boolean
  sortOrder: number
}

export interface ProductListParams extends SearchPageParams {
  /** Omit for both. */
  active?: 'true' | 'false' | ''
}

export const MAX_BULK_PRODUCTS = 100
