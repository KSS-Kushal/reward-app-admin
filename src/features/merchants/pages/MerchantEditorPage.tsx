import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { useCreateMerchant, useUpdateMerchant } from '../api/mutations'
import { useMerchant } from '../api/queries'
import { MerchantForm } from '../components/MerchantForm'
import { formToMerchantRequest } from '../schemas/merchant.schema'

export function MerchantEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useMerchant(id)
  const create = useCreateMerchant()
  const update = useUpdateMerchant()
  useBreadcrumbLabel(query.data?.name, id ? `/admin/merchants/${id}` : undefined)

  const back = id ? `/admin/merchants/${id}` : '/admin/merchants'

  if (id && query.isLoading) return <PageSkeleton />
  if (id && (query.isError || !query.data)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit merchant" backTo="/admin/merchants" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? `Edit ${query.data?.name ?? 'merchant'}` : 'New merchant'}
        description={id ? undefined : 'Add a store users can shop at to earn cashback.'}
        backTo={back}
      />
      <MerchantForm
        key={query.data?.updatedAt ?? 'new'}
        merchant={query.data}
        pending={create.isPending || update.isPending}
        onCancel={() => navigate(back)}
        onSubmit={async (values) => {
          const body = formToMerchantRequest(values, !id)
          const saved = id ? await update.mutateAsync({ id, body }) : await create.mutateAsync(body)
          navigate(`/admin/merchants/${saved.id}`)
        }}
      />
    </div>
  )
}
