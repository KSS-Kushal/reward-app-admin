import { useApiMutation } from '@/hooks/use-api-mutation'
import { ARTICLE_STATUS_LABELS, type ArticleRequest, type ArticleStatus } from '../types/article.types'
import { articleApi, articleToRequest } from './article.api'
import { articlesKeys } from './keys'

export function useCreateArticle() {
  return useApiMutation({
    mutationFn: (body: ArticleRequest) => articleApi.create(body),
    successMessage: 'Article created successfully.',
    invalidate: [articlesKeys.all],
  })
}

export function useUpdateArticle() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: ArticleRequest }) => articleApi.update(id, body),
    successMessage: 'Article updated successfully.',
    invalidate: [articlesKeys.all],
  })
}

/**
 * Publish / archive / unpublish from the list. PUT needs every field, so the full article is fetched first
 * rather than trusting list rows.
 */
export function useChangeArticleStatus() {
  return useApiMutation({
    mutationFn: async ({ id, status }: { id: string; status: ArticleStatus }) => {
      const article = await articleApi.getById(id)
      return articleApi.update(id, articleToRequest(article, { status }))
    },
    successMessage: (article) => `Article moved to ${ARTICLE_STATUS_LABELS[article.status].toLowerCase()}.`,
    invalidate: [articlesKeys.all],
  })
}

export function useDeleteArticle() {
  return useApiMutation({
    mutationFn: (id: string) => articleApi.remove(id),
    successMessage: 'Article deleted successfully.',
    invalidate: [articlesKeys.all],
  })
}
