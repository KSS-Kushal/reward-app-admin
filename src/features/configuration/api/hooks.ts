import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { configApi } from './config.api'

export const configKeys = { all: ['config'] as const }

export function useConfigEntries() {
  return useQuery({ queryKey: configKeys.all, queryFn: ({ signal }) => configApi.list(signal) })
}

export function useUpdateConfig(label: string) {
  const queryClient = useQueryClient()
  return useApiMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => configApi.update(key, value),
    successMessage: `${label} saved successfully.`,
    // The response already contains every entry.
    onSuccess: (entries) => queryClient.setQueryData(configKeys.all, entries),
  })
}
