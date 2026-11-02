import type { Category, CategoryRequest } from '@/components/crud/category'
import { api } from '@/lib/api/client'

const path = (id: string) => `/admin/merchant-categories/${encodeURIComponent(id)}`

export const merchantCategoryApi = {
  list: (signal?: AbortSignal) => api.get<Category[]>('/admin/merchant-categories', undefined, { signal }),
  create: (body: CategoryRequest) => api.post<Category>('/admin/merchant-categories', body),
  update: (id: string, body: CategoryRequest) => api.put<Category>(path(id), body),
  /** 409 IN_USE while it has stores. */
  remove: (id: string) => api.delete(path(id)),
}
