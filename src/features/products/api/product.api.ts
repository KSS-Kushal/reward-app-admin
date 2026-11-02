import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { Product, ProductListParams, ProductRequest } from '../types/product.types'

const merchantPath = (merchantId: string) => `/admin/merchants/${encodeURIComponent(merchantId)}/products`
const productPath = (id: string) => `/admin/products/${encodeURIComponent(id)}`

export const productApi = {
  listForMerchant: (merchantId: string, params: ProductListParams, signal?: AbortSignal) =>
    api.get<Page<Product>>(merchantPath(merchantId), params, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<Product>(productPath(id), undefined, { signal }),
  create: (merchantId: string, body: ProductRequest) => api.post<Product>(merchantPath(merchantId), body),
  /** All or nothing; errors are keyed `products[i].field`. */
  createBulk: (merchantId: string, products: ProductRequest[]) =>
    api.post<Product[]>(`${merchantPath(merchantId)}/bulk`, { products }),
  update: (id: string, body: ProductRequest) => api.put<Product>(productPath(id), body),
  remove: (id: string) => api.delete(productPath(id)),
}
