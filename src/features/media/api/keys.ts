import type { MediaListParams } from '../types/media.types'

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (params: MediaListParams) => [...mediaKeys.lists(), params] as const,
}
