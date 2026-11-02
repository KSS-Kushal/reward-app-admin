export const EARN_OPTION_TYPES = ['readAndEarn', 'shopAndEarn', 'readArticle'] as const
export type EarnOptionType = (typeof EARN_OPTION_TYPES)[number]

export const EARN_OPTION_TYPE_LABELS: Record<EarnOptionType, string> = {
  readAndEarn: 'Read & Earn',
  shopAndEarn: 'Shop & Earn',
  readArticle: 'Read article',
}

export interface EarnOption {
  id: string
  type: EarnOptionType
  title: string
  subtitle: string
  imageUrl: string | null
  sortOrder: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface EarnOptionRequest {
  id?: string
  type: EarnOptionType
  title: string
  subtitle: string
  imageUrl: string | null
  sortOrder: number
  enabled: boolean
}
