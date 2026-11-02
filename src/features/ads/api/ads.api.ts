import { api } from '@/lib/api/client'
import type { Page, PageParams } from '@/lib/api/types'
import type {
  AdCallback,
  AdminAdSettings,
  AdSettingsHistoryItem,
  AdStats,
  AdStatsParams,
  CallbackListParams,
  SaveAdSettingsRequest,
} from '../types/ads.types'

export const adsApi = {
  getSettings: (signal?: AbortSignal) => api.get<AdminAdSettings>('/admin/ads/config', undefined, { signal }),
  /** 409 VERSION_CONFLICT when another admin saved since `version` was loaded. */
  saveSettings: (body: SaveAdSettingsRequest) => api.put<AdminAdSettings>('/admin/ads/config', body),
  history: (params: PageParams, signal?: AbortSignal) =>
    api.get<Page<AdSettingsHistoryItem>>('/admin/ads/config/history', params, { signal }),
  /** Copies an old version into a new one; keeps the current Unity secret. */
  restore: (version: number, currentVersion: number) =>
    api.post<AdminAdSettings>(`/admin/ads/config/history/${version}/restore`, { currentVersion }),
  stats: (params: AdStatsParams, signal?: AbortSignal) =>
    api.get<AdStats>('/admin/ads/stats', params, { signal }),
  callbacks: (params: CallbackListParams, signal?: AbortSignal) =>
    api.get<Page<AdCallback>>('/admin/ads/callbacks', params, { signal }),
}
