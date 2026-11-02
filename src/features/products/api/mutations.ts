import { useApiMutation } from '@/hooks/use-api-mutation'
import type { ProductRequest } from '../types/product.types'
import { productsKeys } from './keys'
import { productApi } from './product.api'

export function useCreateProduct() {
  return useApiMutation({
    mutationFn: ({ merchantId, body }: { merchantId: string; body: ProductRequest }) =>
      productApi.create(merchantId, body),
    successMessage: 'Product created successfully.',
    invalidate: [productsKeys.all],
  })
}

export function useCreateProductsBulk() {
  return useApiMutation({
    mutationFn: ({ merchantId, products }: { merchantId: string; products: ProductRequest[] }) =>
      productApi.createBulk(merchantId, products),
    successMessage: (created) =>
      `${created.length} ${created.length === 1 ? 'product' : 'products'} imported successfully.`,
    invalidate: [productsKeys.all],
  })
}

export function useUpdateProduct() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: ProductRequest }) => productApi.update(id, body),
    successMessage: 'Product updated successfully.',
    invalidate: [productsKeys.all],
  })
}

export function useDeleteProduct() {
  return useApiMutation({
    mutationFn: (id: string) => productApi.remove(id),
    successMessage: 'Product deleted successfully.',
    invalidate: [productsKeys.all],
  })
}
