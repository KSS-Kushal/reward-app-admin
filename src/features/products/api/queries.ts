import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ProductListParams } from '../types/product.types'
import { productsKeys } from './keys'
import { productApi } from './product.api'

export function useMerchantProducts(merchantId: string | undefined, params: ProductListParams) {
  return useQuery({
    queryKey: productsKeys.list(merchantId ?? '', params),
    queryFn: ({ signal }) => productApi.listForMerchant(merchantId!, params, signal),
    placeholderData: keepPreviousData,
    enabled: Boolean(merchantId),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? ''),
    queryFn: ({ signal }) => productApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
