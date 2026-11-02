import type { MerchantListParams } from '../types/merchant.types'

export const merchantsKeys = {
  all: ['merchants'] as const,
  lists: () => [...merchantsKeys.all, 'list'] as const,
  list: (params: MerchantListParams) => [...merchantsKeys.lists(), params] as const,
  detail: (id: string) => [...merchantsKeys.all, 'detail', id] as const,
}
