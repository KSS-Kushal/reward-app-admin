import { useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { useCreateQuizQuestion, useUpdateQuizQuestion } from '../api/mutations'
import { useQuizQuestion } from '../api/queries'
import { QuizQuestionForm } from '../components/QuizQuestionForm'
import { formToQuestionRequest } from '../schemas/quiz-question.schema'

export function QuizQuestionEditorPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = useQuizQuestion(id)
  const create = useCreateQuizQuestion()
  const update = useUpdateQuizQuestion()
  useBreadcrumbLabel(
    query.data ? (query.data.text.length > 40 ? `${query.data.text.slice(0, 40)}…` : query.data.text) : null,
  )

  const backToList = () => navigate('/admin/quiz-questions')
  const defaultType = searchParams.get('type') === 'giveAnswer' ? 'giveAnswer' : 'daily'

  if (id && query.isLoading) return <PageSkeleton />
  if (id && (query.isError || !query.data)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit question" backTo="/admin/quiz-questions" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? 'Edit question' : 'New question'}
        description={id ? undefined : 'Add a question to the daily quiz or the give-answer quiz.'}
        backTo="/admin/quiz-questions"
      />
      <QuizQuestionForm
        key={query.data?.updatedAt ?? 'new'}
        question={query.data}
        defaultType={defaultType}
        pending={create.isPending || update.isPending}
        onCancel={backToList}
        onSubmit={async (values) => {
          const body = formToQuestionRequest(values, !id)
          if (id) await update.mutateAsync({ id, body })
          else await create.mutateAsync(body)
          backToList()
        }}
      />
    </div>
  )
}
