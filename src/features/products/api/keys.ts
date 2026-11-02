import type { ProductListParams } from '../types/product.types'

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (merchantId: string, params: ProductListParams) =>
    [...productsKeys.lists(), merchantId, params] as const,
  detail: (id: string) => [...productsKeys.all, 'detail', id] as const,
}
