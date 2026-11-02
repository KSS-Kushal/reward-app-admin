import { useQuery } from '@tanstack/react-query'
import type { CategoryRequest } from '@/components/crud/category'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { toApiError } from '@/lib/api/errors'
import { articleCategoryApi } from './article-category.api'

export const articleCategoriesKeys = {
  all: ['article-categories'] as const,
}

export function useArticleCategories() {
  return useQuery({
    queryKey: articleCategoriesKeys.all,
    queryFn: ({ signal }) => articleCategoryApi.list(signal),
    staleTime: 60_000,
  })
}

export function useCreateArticleCategory() {
  return useApiMutation({
    mutationFn: (body: CategoryRequest) => articleCategoryApi.create(body),
    successMessage: 'Category created successfully.',
    invalidate: [articleCategoriesKeys.all],
  })
}

export function useUpdateArticleCategory() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryRequest }) => articleCategoryApi.update(id, body),
    successMessage: 'Category updated successfully.',
    // Article views carry the category name.
    invalidate: [articleCategoriesKeys.all, ['articles']],
  })
}

export function useDeleteArticleCategory() {
  return useApiMutation({
    mutationFn: (id: string) => articleCategoryApi.remove(id),
    successMessage: 'Category deleted successfully.',
    invalidate: [articleCategoriesKeys.all],
    errorMessage: (error) =>
      toApiError(error).code === 'IN_USE'
        ? 'This category still has articles. Move or delete them first.'
        : null,
  })
}
