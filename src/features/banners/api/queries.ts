import { useQuery } from '@tanstack/react-query'
import { bannerApi } from './banner.api'
import { bannersKeys } from './keys'

export function useBanners() {
  return useQuery({ queryKey: bannersKeys.list(), queryFn: ({ signal }) => bannerApi.list(signal) })
}

export function useBanner(id: string | undefined) {
  return useQuery({
    queryKey: bannersKeys.detail(id ?? ''),
    queryFn: ({ signal }) => bannerApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
