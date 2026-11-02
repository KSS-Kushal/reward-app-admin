import { useQuery } from '@tanstack/react-query'
import type { CategoryRequest } from '@/components/crud/category'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { toApiError } from '@/lib/api/errors'
import { merchantCategoryApi } from './merchant-category.api'

export const merchantCategoriesKeys = {
  all: ['merchant-categories'] as const,
}

export function useMerchantCategories() {
  return useQuery({
    queryKey: merchantCategoriesKeys.all,
    queryFn: ({ signal }) => merchantCategoryApi.list(signal),
    staleTime: 60_000,
  })
}

export function useCreateMerchantCategory() {
  return useApiMutation({
    mutationFn: (body: CategoryRequest) => merchantCategoryApi.create(body),
    successMessage: 'Category created successfully.',
    invalidate: [merchantCategoriesKeys.all],
  })
}

export function useUpdateMerchantCategory() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryRequest }) => merchantCategoryApi.update(id, body),
    successMessage: 'Category updated successfully.',
    invalidate: [merchantCategoriesKeys.all],
  })
}

export function useDeleteMerchantCategory() {
  return useApiMutation({
    mutationFn: (id: string) => merchantCategoryApi.remove(id),
    successMessage: 'Category deleted successfully.',
    invalidate: [merchantCategoriesKeys.all],
    errorMessage: (error) =>
      toApiError(error).code === 'IN_USE'
        ? 'This category still has stores. Move or delete them first.'
        : null,
  })
}
