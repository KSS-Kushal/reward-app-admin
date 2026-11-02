import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ArticleListParams } from '../types/article.types'
import { articleApi } from './article.api'
import { articlesKeys } from './keys'

export function useArticles(params: ArticleListParams) {
  return useQuery({
    queryKey: articlesKeys.list(params),
    queryFn: ({ signal }) => articleApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: articlesKeys.detail(id ?? ''),
    queryFn: ({ signal }) => articleApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
