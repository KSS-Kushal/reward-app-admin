import type { PageParams } from '@/lib/api/types'

export const MEDIA_FOLDERS = [
  'banners',
  'articles',
  'merchants',
  'products',
  'quiz',
  'earn-options',
  'general',
] as const
export type MediaFolder = (typeof MEDIA_FOLDERS)[number]

export const MEDIA_FOLDER_LABELS: Record<MediaFolder, string> = {
  banners: 'Banners',
  articles: 'Articles',
  merchants: 'Merchants',
  products: 'Products',
  quiz: 'Quiz',
  'earn-options': 'Earn options',
  general: 'General',
}

export interface MediaAsset {
  id: string
  url: string
  fileId: string
  filePath: string
  folder: MediaFolder
  contentType: string
  sizeBytes: number
  width: number | null
  height: number | null
  originalName: string | null
  createdAt: string
}

export interface MediaListParams extends PageParams {
  folder?: MediaFolder | ''
}

/** Upload limits enforced by the backend (`POST /admin/media`). */
export const MEDIA_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024
