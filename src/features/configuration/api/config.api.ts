import { api } from '@/lib/api/client'
import type { ConfigEntry } from '../types/config.types'

export const configApi = {
  list: (signal?: AbortSignal) => api.get<ConfigEntry[]>('/admin/config', undefined, { signal }),
  /** Body is the new JSON value. Responds with all entries. 422 with the reason when invalid, 404 for an unknown key. */
  update: (key: string, value: unknown) =>
    api.put<ConfigEntry[]>(`/admin/config/${encodeURIComponent(key)}`, value),
}
