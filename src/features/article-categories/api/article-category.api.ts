import type { Category, CategoryRequest } from '@/components/crud/category'
import { api } from '@/lib/api/client'

const path = (id: string) => `/admin/article-categories/${encodeURIComponent(id)}`

export const articleCategoryApi = {
  list: (signal?: AbortSignal) => api.get<Category[]>('/admin/article-categories', undefined, { signal }),
  create: (body: CategoryRequest) => api.post<Category>('/admin/article-categories', body),
  update: (id: string, body: CategoryRequest) => api.put<Category>(path(id), body),
  /** 409 IN_USE while it has articles. */
  remove: (id: string) => api.delete(path(id)),
}
