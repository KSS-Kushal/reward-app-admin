import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { useCreateBanner, useUpdateBanner } from '../api/mutations'
import { useBanner } from '../api/queries'
import { BannerForm } from '../components/BannerForm'
import { formToBannerRequest } from '../schemas/banner.schema'

export function BannerEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useBanner(id)
  const create = useCreateBanner()
  const update = useUpdateBanner()
  useBreadcrumbLabel(query.data?.title)

  const backToList = () => navigate('/admin/banners')

  if (id && query.isLoading) return <PageSkeleton />
  if (id && (query.isError || !query.data)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit banner" backTo="/admin/banners" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? 'Edit banner' : 'New banner'}
        description={id ? query.data?.title : 'Promote a feature or offer on the app home screen.'}
        backTo="/admin/banners"
      />
      <BannerForm
        key={query.data?.updatedAt ?? 'new'}
        banner={query.data}
        pending={create.isPending || update.isPending}
        onCancel={backToList}
        onSubmit={async (values) => {
          const body = formToBannerRequest(values, !id)
          if (id) await update.mutateAsync({ id, body })
          else await create.mutateAsync(body)
          backToList()
        }}
      />
    </div>
  )
}
