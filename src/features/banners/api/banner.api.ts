import { api } from '@/lib/api/client'
import type { Banner, BannerRequest } from '../types/banner.types'

const path = (id: string) => `/admin/banners/${encodeURIComponent(id)}`

export const bannerApi = {
  /** All banners including inactive ones, highest priority first. */
  list: (signal?: AbortSignal) => api.get<Banner[]>('/admin/banners', undefined, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<Banner>(path(id), undefined, { signal }),
  create: (body: BannerRequest) => api.post<Banner>('/admin/banners', body),
  update: (id: string, body: BannerRequest) => api.put<Banner>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}
