import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/errors'

interface Options<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  /** Toast shown on success. */
  successMessage?: string | ((data: TData, variables: TVariables) => string)
  /** Queries to refetch after success (prefix match). */
  invalidate?: QueryKey[] | ((data: TData, variables: TVariables) => QueryKey[])
  /** Overrides the error toast text; the backend message is used otherwise. */
  errorMessage?: (error: unknown) => string | null
  onSuccess?: (data: TData, variables: TVariables) => void
}

/**
 * The standard admin mutation: run, toast the outcome, invalidate affected queries.
 * Server field errors are also toasted; forms additionally map them onto fields with applyServerErrors.
 */
export function useApiMutation<TData, TVariables = void>(options: Options<TData, TVariables>) {
  const queryClient = useQueryClient()
  return useMutation<TData, unknown, TVariables>({
    mutationFn: options.mutationFn,
    onSuccess: async (data, variables) => {
      const keys =
        typeof options.invalidate === 'function'
          ? options.invalidate(data, variables)
          : (options.invalidate ?? [])
      if (options.successMessage) {
        toast.success(
          typeof options.successMessage === 'function'
            ? options.successMessage(data, variables)
            : options.successMessage,
        )
      }
      options.onSuccess?.(data, variables)
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
    onError: (error) => {
      const message = options.errorMessage?.(error) ?? getErrorMessage(error)
      toast.error(message)
    },
  })
}
