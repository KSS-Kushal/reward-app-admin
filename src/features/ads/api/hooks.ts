import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { toApiError } from '@/lib/api/errors'
import type { PageParams } from '@/lib/api/types'
import type { AdStatsParams, CallbackListParams, SaveAdSettingsRequest } from '../types/ads.types'
import { adsApi } from './ads.api'

export const adsKeys = {
  all: ['ads'] as const,
  settings: () => [...adsKeys.all, 'settings'] as const,
  history: (params: PageParams) => [...adsKeys.all, 'history', params] as const,
  stats: (params: AdStatsParams) => [...adsKeys.all, 'stats', params] as const,
  callbacks: (params: CallbackListParams) => [...adsKeys.all, 'callbacks', params] as const,
}

export const isVersionConflict = (error: unknown) => toApiError(error).code === 'VERSION_CONFLICT'

export function useAdSettings() {
  return useQuery({ queryKey: adsKeys.settings(), queryFn: ({ signal }) => adsApi.getSettings(signal) })
}

export function useSaveAdSettings() {
  const queryClient = useQueryClient()
  return useApiMutation({
    mutationFn: (body: SaveAdSettingsRequest) => adsApi.saveSettings(body),
    successMessage: (saved) => `Ad settings saved (version ${saved.version}).`,
    onSuccess: (saved) => queryClient.setQueryData(adsKeys.settings(), saved),
    invalidate: [[...adsKeys.all, 'history']],
    errorMessage: (error) =>
      isVersionConflict(error) ? 'Someone else changed the settings. Reload to see their changes.' : null,
  })
}

export function useAdSettingsHistory(params: PageParams) {
  return useQuery({
    queryKey: adsKeys.history(params),
    queryFn: ({ signal }) => adsApi.history(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useRestoreAdSettings() {
  const queryClient = useQueryClient()
  return useApiMutation({
    mutationFn: ({ version, currentVersion }: { version: number; currentVersion: number }) =>
      adsApi.restore(version, currentVersion),
    successMessage: (saved, { version }) => `Version ${version} restored as version ${saved.version}.`,
    onSuccess: (saved) => queryClient.setQueryData(adsKeys.settings(), saved),
    invalidate: [[...adsKeys.all, 'history']],
    errorMessage: (error) =>
      isVersionConflict(error) ? 'Someone else changed the settings meanwhile. Reload and try again.' : null,
  })
}

export function useAdStats(params: AdStatsParams) {
  return useQuery({
    queryKey: adsKeys.stats(params),
    queryFn: ({ signal }) => adsApi.stats(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useAdCallbacks(params: CallbackListParams) {
  return useQuery({
    queryKey: adsKeys.callbacks(params),
    queryFn: ({ signal }) => adsApi.callbacks(params, signal),
    placeholderData: keepPreviousData,
  })
}
