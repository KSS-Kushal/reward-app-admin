import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { OfferRequest } from '../types/offer.types'
import { offerApi } from './offer.api'

export const offersKeys = {
  all: ['offers'] as const,
  merchant: (merchantId: string) => [...offersKeys.all, 'merchant', merchantId] as const,
}

export function useMerchantOffers(merchantId: string | undefined) {
  return useQuery({
    queryKey: offersKeys.merchant(merchantId ?? ''),
    queryFn: ({ signal }) => offerApi.listForMerchant(merchantId!, signal),
    enabled: Boolean(merchantId),
  })
}

export function useCreateOffer() {
  return useApiMutation({
    mutationFn: ({ merchantId, body }: { merchantId: string; body: OfferRequest }) =>
      offerApi.create(merchantId, body),
    successMessage: 'Offer created successfully.',
    invalidate: [offersKeys.all],
  })
}

export function useUpdateOffer() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: OfferRequest }) => offerApi.update(id, body),
    successMessage: 'Offer updated successfully.',
    invalidate: [offersKeys.all],
  })
}

export function useDeleteOffer() {
  return useApiMutation({
    mutationFn: (id: string) => offerApi.remove(id),
    successMessage: 'Offer deleted successfully.',
    invalidate: [offersKeys.all],
  })
}
