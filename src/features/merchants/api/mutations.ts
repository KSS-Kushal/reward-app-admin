import { useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { MerchantRequest } from '../types/merchant.types'
import { merchantsKeys } from './keys'
import { merchantApi } from './merchant.api'

export function useCreateMerchant() {
  return useApiMutation({
    mutationFn: (body: MerchantRequest) => merchantApi.create(body),
    successMessage: 'Merchant created successfully.',
    invalidate: [merchantsKeys.all],
  })
}

export function useUpdateMerchant() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: MerchantRequest }) => merchantApi.update(id, body),
    successMessage: 'Merchant updated successfully.',
    invalidate: [merchantsKeys.all],
  })
}

export function useDeleteMerchant() {
  const queryClient = useQueryClient()
  return useApiMutation({
    mutationFn: (id: string) => merchantApi.remove(id),
    successMessage: 'Merchant deleted successfully.',
    invalidate: [merchantsKeys.lists(), ['offers'], ['products']],
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: merchantsKeys.detail(id) }),
  })
}
