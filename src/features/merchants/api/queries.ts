import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MerchantListParams } from '../types/merchant.types'
import { merchantsKeys } from './keys'
import { merchantApi } from './merchant.api'

export function useMerchants(params: MerchantListParams, enabled = true) {
  return useQuery({
    queryKey: merchantsKeys.list(params),
    queryFn: ({ signal }) => merchantApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMerchant(id: string | undefined) {
  return useQuery({
    queryKey: merchantsKeys.detail(id ?? ''),
    queryFn: ({ signal }) => merchantApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
