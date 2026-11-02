import type { SearchPageParams } from '@/lib/api/types'

/** Placeholder replaced with the user's affiliate id in tracking and affiliate links. */
export const SUB_ID_PLACEHOLDER = '{subId}'

export interface Merchant {
  id: string
  name: string
  categoryId: string
  rewardText: string
  cashbackPercent: number
  description: string
  trackingUrlTemplate: string
  brandColor: string | null
  logoUrl: string | null
  featured: boolean
  active: boolean
  sortOrder: number
  terms: string[]
  createdAt: string
  updatedAt: string
}

export interface MerchantRequest {
  id?: string
  name: string
  categoryId: string
  rewardText: string
  cashbackPercent: number
  description: string
  trackingUrlTemplate: string
  brandColor: string | null
  logoUrl: string | null
  featured: boolean
  active: boolean
  sortOrder: number
  terms: string[]
}

export interface MerchantListParams extends SearchPageParams {
  categoryId?: string
}
