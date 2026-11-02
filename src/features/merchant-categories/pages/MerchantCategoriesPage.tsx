import { CategoryManager } from '@/components/crud/CategoryManager'
import {
  useCreateMerchantCategory,
  useDeleteMerchantCategory,
  useMerchantCategories,
  useUpdateMerchantCategory,
} from '../api/hooks'

export function MerchantCategoriesPage() {
  return (
    <CategoryManager
      title="Merchant Categories"
      description="Categories that group stores in Shop & Earn."
      noun="merchant category"
      query={useMerchantCategories()}
      create={useCreateMerchantCategory()}
      update={useUpdateMerchantCategory()}
      remove={useDeleteMerchantCategory()}
    >
      stores
    </CategoryManager>
  )
}
