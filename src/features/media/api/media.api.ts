import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { MediaAsset, MediaFolder, MediaListParams } from '../types/media.types'

export interface UploadOptions {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export const mediaApi = {
  list: (params: MediaListParams, signal?: AbortSignal) =>
    api.get<Page<MediaAsset>>('/admin/media', params, { signal }),

  /** `POST /admin/media` (multipart) → 201 with the media view. */
  upload: (file: File, folder: MediaFolder, options: UploadOptions = {}) => {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', folder)
    return api.post<MediaAsset>('/admin/media', body, {
      signal: options.signal,
      // Uploads can be slow on poor connections.
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
  },

  /** 409 IN_USE while content still uses the URL. */
  remove: (id: string) => api.delete(`/admin/media/${encodeURIComponent(id)}`),
}
