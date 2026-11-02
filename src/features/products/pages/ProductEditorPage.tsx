import { useLocation, useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { useMerchant } from '@/features/merchants/api/queries'
import { useCreateProduct, useUpdateProduct } from '../api/mutations'
import { useProduct } from '../api/queries'
import { ProductForm } from '../components/ProductForm'
import { formToProductRequest } from '../schemas/product.schema'

/**
 * Two routes share this page:
 * - `/admin/merchants/:id/products/new` (`:id` is the merchant) creates a product;
 * - `/admin/products/:id/edit` (`:id` is the product) edits one.
 */
export function ProductEditorPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isEdit = pathname.startsWith('/admin/products/')
  const productQuery = useProduct(isEdit ? id : undefined)
  const merchantId = isEdit ? productQuery.data?.merchantId : id
  const merchant = useMerchant(merchantId)
  const create = useCreateProduct()
  const update = useUpdateProduct()
  useBreadcrumbLabel(
    isEdit ? productQuery.data?.name : merchant.data?.name,
    isEdit ? undefined : `/admin/merchants/${merchantId}`,
  )

  const back = merchantId ? `/admin/merchants/${merchantId}/products` : '/admin/products'

  if (isEdit && productQuery.isLoading) return <PageSkeleton />
  if (isEdit && (productQuery.isError || !productQuery.data)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit product" backTo="/admin/products" />
        <ErrorState error={productQuery.error} onRetry={() => void productQuery.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        description={
          merchant.data ? `${merchant.data.name} · products open with the user's affiliate id.` : undefined
        }
        backTo={back}
      />
      <ProductForm
        key={productQuery.data?.updatedAt ?? 'new'}
        product={productQuery.data}
        pending={create.isPending || update.isPending}
        onCancel={() => navigate(back)}
        onSubmit={async (values) => {
          const body = formToProductRequest(values, !isEdit)
          if (isEdit && id) await update.mutateAsync({ id, body })
          else if (merchantId) await create.mutateAsync({ merchantId, body })
          navigate(back)
        }}
      />
    </div>
  )
}
