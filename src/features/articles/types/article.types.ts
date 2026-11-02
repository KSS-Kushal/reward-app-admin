import type { SearchPageParams } from '@/lib/api/types'

export const ARTICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

/** Admin article view. `content` paragraphs are separated by a blank line (`\n\n`). */
export interface Article {
  id: string
  title: string
  summary: string
  content: string
  categoryId: string
  categoryName: string
  author: string
  publishedAt: string
  readTimeMinutes: number
  imageUrl: string | null
  rewardCoins: number
  requiredReadSeconds: number
  status: ArticleStatus
  createdAt: string
  updatedAt: string
}

/** `POST`/`PUT /admin/articles`. Null optional fields take the backend defaults. */
export interface ArticleRequest {
  id?: string
  title: string
  summary: string
  content: string
  categoryId: string
  author: string | null
  publishedAt: string | null
  readTimeMinutes: number | null
  imageUrl: string | null
  rewardCoins: number | null
  requiredReadSeconds: number | null
  status: ArticleStatus
}

export interface ArticleListParams extends SearchPageParams {
  status?: ArticleStatus | ''
  categoryId?: string
}
