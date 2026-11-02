import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { useCreateArticle, useUpdateArticle } from '../api/mutations'
import { useArticle } from '../api/queries'
import { ArticleForm } from '../components/ArticleForm'
import { formToArticleRequest } from '../schemas/article.schema'

export function ArticleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useArticle(id)
  const create = useCreateArticle()
  const update = useUpdateArticle()
  useBreadcrumbLabel(query.data?.title)

  const backToList = () => navigate('/admin/articles')

  if (id && query.isLoading) return <PageSkeleton />
  if (id && (query.isError || !query.data)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit article" backTo="/admin/articles" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? 'Edit article' : 'New article'}
        description={
          id ? (
            <span className="inline-flex items-center gap-2">
              {query.data?.title} {query.data && <StatusBadge status={query.data.status} />}
            </span>
          ) : (
            'Write an article for Read & Earn.'
          )
        }
        backTo="/admin/articles"
      />
      <ArticleForm
        key={query.data?.updatedAt ?? 'new'}
        article={query.data}
        pending={create.isPending || update.isPending}
        onCancel={backToList}
        onSubmit={async (values) => {
          const body = formToArticleRequest(values, !id)
          if (id) await update.mutateAsync({ id, body })
          else await create.mutateAsync(body)
          backToList()
        }}
      />
    </div>
  )
}
