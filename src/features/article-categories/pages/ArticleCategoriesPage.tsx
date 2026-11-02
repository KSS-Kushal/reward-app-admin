import { CategoryManager } from '@/components/crud/CategoryManager'
import {
  useArticleCategories,
  useCreateArticleCategory,
  useDeleteArticleCategory,
  useUpdateArticleCategory,
} from '../api/hooks'

export function ArticleCategoriesPage() {
  return (
    <CategoryManager
      title="Article Categories"
      description="Categories readers use to browse articles in the app."
      noun="article category"
      query={useArticleCategories()}
      create={useCreateArticleCategory()}
      update={useUpdateArticleCategory()}
      remove={useDeleteArticleCategory()}
    >
      articles
    </CategoryManager>
  )
}
