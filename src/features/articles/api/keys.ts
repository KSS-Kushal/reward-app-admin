import type { ArticleListParams } from '../types/article.types'

export const articlesKeys = {
  all: ['articles'] as const,
  lists: () => [...articlesKeys.all, 'list'] as const,
  list: (params: ArticleListParams) => [...articlesKeys.lists(), params] as const,
  detail: (id: string) => [...articlesKeys.all, 'detail', id] as const,
}
