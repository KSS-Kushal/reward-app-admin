import { useApiMutation } from '@/hooks/use-api-mutation'
import type { BannerRequest } from '../types/banner.types'
import { bannerApi } from './banner.api'
import { bannersKeys } from './keys'

export function useCreateBanner() {
  return useApiMutation({
    mutationFn: (body: BannerRequest) => bannerApi.create(body),
    successMessage: 'Banner created successfully.',
    invalidate: [bannersKeys.all],
  })
}

export function useUpdateBanner() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: BannerRequest }) => bannerApi.update(id, body),
    successMessage: 'Banner updated successfully.',
    invalidate: [bannersKeys.all],
  })
}

export function useDeleteBanner() {
  return useApiMutation({
    mutationFn: (id: string) => bannerApi.remove(id),
    successMessage: 'Banner deleted successfully.',
    invalidate: [bannersKeys.all],
  })
}
