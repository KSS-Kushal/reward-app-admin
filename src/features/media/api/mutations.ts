import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { toApiError } from '@/lib/api/errors'
import type { MediaFolder } from '../types/media.types'
import { mediaKeys } from './keys'
import { mediaApi, type UploadOptions } from './media.api'

/** Upload without toasts: the uploader shows progress and errors inline. */
export function useUploadMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, folder, ...options }: { file: File; folder: MediaFolder } & UploadOptions) =>
      mediaApi.upload(file, folder, options),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.lists() }),
  })
}

export function useDeleteMedia() {
  return useApiMutation({
    mutationFn: (id: string) => mediaApi.remove(id),
    successMessage: 'Media deleted successfully.',
    invalidate: [mediaKeys.lists()],
    errorMessage: (error) => {
      const apiError = toApiError(error)
      return apiError.code === 'IN_USE' ? `This media is currently in use. ${apiError.message}` : null
    },
  })
}
