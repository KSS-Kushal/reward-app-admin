/** The envelope every backend response uses, success or error. */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors?: Record<string, string>
  code?: string
}

/** `data` of a paginated response. `currentPage` is 1-based. */
export interface Page<T> {
  items: T[]
  currentPage: number
  limit: number
  totalItems: number
  totalPages: number
  isLast: boolean
  hasNext: boolean
}

/** Query parameters shared by every paginated list. `page` is 1-based; `limit` is 1–50. */
export interface PageParams {
  page?: number
  limit?: number
}

export interface SearchPageParams extends PageParams {
  q?: string
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
