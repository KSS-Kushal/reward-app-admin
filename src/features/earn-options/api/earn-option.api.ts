import { api } from '@/lib/api/client'
import type { EarnOption, EarnOptionRequest } from '../types/earn-option.types'

const path = (id: string) => `/admin/earn-options/${encodeURIComponent(id)}`

export const earnOptionApi = {
  list: (signal?: AbortSignal) => api.get<EarnOption[]>('/admin/earn-options', undefined, { signal }),
  create: (body: EarnOptionRequest) => api.post<EarnOption>('/admin/earn-options', body),
  update: (id: string, body: EarnOptionRequest) => api.put<EarnOption>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}

export function earnOptionToRequest(
  option: EarnOption,
  patch: Partial<EarnOptionRequest> = {},
): EarnOptionRequest {
  return {
    type: option.type,
    title: option.title,
    subtitle: option.subtitle,
    imageUrl: option.imageUrl,
    sortOrder: option.sortOrder,
    enabled: option.enabled,
    ...patch,
  }
}
