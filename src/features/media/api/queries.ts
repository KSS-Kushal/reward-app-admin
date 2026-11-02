import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MediaListParams } from '../types/media.types'
import { mediaKeys } from './keys'
import { mediaApi } from './media.api'

export function useMediaList(params: MediaListParams, enabled = true) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    // The signal aborts superseded requests, e.g. when switching folders quickly.
    queryFn: ({ signal }) => mediaApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}
