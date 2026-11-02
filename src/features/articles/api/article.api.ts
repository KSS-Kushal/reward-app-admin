import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { Article, ArticleListParams, ArticleRequest } from '../types/article.types'

const path = (id: string) => `/admin/articles/${encodeURIComponent(id)}`

export const articleApi = {
  list: (params: ArticleListParams, signal?: AbortSignal) =>
    api.get<Page<Article>>('/admin/articles', params, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<Article>(path(id), undefined, { signal }),
  create: (body: ArticleRequest) => api.post<Article>('/admin/articles', body),
  update: (id: string, body: ArticleRequest) => api.put<Article>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}

export function articleToRequest(article: Article, patch: Partial<ArticleRequest> = {}): ArticleRequest {
  return {
    title: article.title,
    summary: article.summary,
    content: article.content,
    categoryId: article.categoryId,
    author: article.author,
    publishedAt: article.publishedAt,
    readTimeMinutes: article.readTimeMinutes,
    imageUrl: article.imageUrl,
    rewardCoins: article.rewardCoins,
    requiredReadSeconds: article.requiredReadSeconds,
    status: article.status,
    ...patch,
  }
}
