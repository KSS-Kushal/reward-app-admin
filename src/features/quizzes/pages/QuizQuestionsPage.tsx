import type { ColumnDef } from '@tanstack/react-table'
import { Brain, Calculator, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useListParams } from '@/hooks/use-list-params'
import { useDeleteQuizQuestion } from '../api/mutations'
import { useQuizQuestions } from '../api/queries'
import {
  ANSWER_TYPE_LABELS,
  EDITABLE_QUIZ_TYPES,
  QUIZ_TYPE_LABELS,
  type EditableQuizType,
  type QuizQuestion,
} from '../types/quiz.types'

const FILTER_KEYS = ['type'] as const

function CorrectAnswer({ question }: { question: QuizQuestion }) {
  if (question.answerType === 'singleChoice') {
    const correct = question.options.find((option) => option.isCorrect)
    return (
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
        <span className="truncate">{correct?.text ?? '—'}</span>
        <span className="text-xs text-muted-foreground">of {question.options.length}</span>
      </span>
    )
  }
  const answers = question.acceptedAnswers ?? []
  return (
    <span className="flex flex-wrap gap-1">
      {answers.slice(0, 3).map((answer) => (
        <Badge key={answer} variant="outline" className="font-normal">
          {answer}
        </Badge>
      ))}
      {answers.length > 3 && <span className="text-xs text-muted-foreground">+{answers.length - 3}</span>}
    </span>
  )
}

export function QuizQuestionsPage() {
  const navigate = useNavigate()
  const { filters, page, limit, update } = useListParams(FILTER_KEYS)
  const type = (EDITABLE_QUIZ_TYPES as readonly string[]).includes(filters.type)
    ? (filters.type as EditableQuizType)
    : ''
  const query = useQuizQuestions({ type, page, limit })
  const remove = useDeleteQuizQuestion()
  const [toDelete, setToDelete] = useState<QuizQuestion | null>(null)

  const columns = useMemo<ColumnDef<QuizQuestion, unknown>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Question',
        cell: ({ row: { original } }) => (
          <div className="flex max-w-lg min-w-64 items-center gap-3">
            {original.imageUrl && <ImagePreview src={original.imageUrl} alt="" className="size-10" />}
            <p className="line-clamp-2 font-medium">{original.text}</p>
          </div>
        ),
      },
      {
        accessorKey: 'quizType',
        header: 'Quiz',
        cell: ({ row: { original } }) => (
          <Badge variant="secondary">{QUIZ_TYPE_LABELS[original.quizType] ?? original.quizType}</Badge>
        ),
      },
      {
        accessorKey: 'answerType',
        header: 'Answer type',
        cell: ({ row: { original } }) => (
          <span className="whitespace-nowrap">{ANSWER_TYPE_LABELS[original.answerType]}</span>
        ),
      },
      {
        id: 'answer',
        header: 'Correct answer',
        cell: ({ row: { original } }) => (
          <div className="max-w-56">
            <CorrectAnswer question={original} />
          </div>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => <BooleanBadge value={getValue() as boolean} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label="Question actions"
            actions={[
              {
                label: 'Edit',
                icon: Pencil,
                onSelect: () => navigate(`/admin/quiz-questions/${original.id}/edit`),
              },
              {
                label: 'Delete',
                icon: Trash2,
                onSelect: () => setToDelete(original),
                destructive: true,
                separated: true,
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  )

  const createButton = (
    <Button asChild>
      <Link to={`/admin/quiz-questions/new${type ? `?type=${type}` : ''}`}>
        <Plus /> Add question
      </Link>
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Questions"
        description="Questions for the daily quiz and the give-answer quiz."
        actions={createButton}
      />

      <Alert>
        <Calculator />
        <AlertDescription>
          Math quiz questions are generated automatically by the server, so they don't appear here. Rewards,
          timers and question counts are set in{' '}
          <Link
            to="/admin/config?tab=rewards"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Reward Configuration
          </Link>
          .
        </AlertDescription>
      </Alert>

      <Tabs value={type || 'all'} onValueChange={(value) => update({ type: value === 'all' ? '' : value })}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {EDITABLE_QUIZ_TYPES.map((quizType) => (
            <TabsTrigger key={quizType} value={quizType}>
              {QUIZ_TYPE_LABELS[quizType]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.items}
            isLoading={query.isLoading}
            isFetching={query.isPlaceholderData}
            getRowId={(question) => question.id}
            onRowClick={(question) => navigate(`/admin/quiz-questions/${question.id}/edit`)}
            caption="Quiz questions"
            emptyState={
              <EmptyState
                icon={Brain}
                title="No questions found"
                description="Add questions so users have something to answer."
                action={createButton}
              />
            }
          />
          <Pagination
            page={query.data}
            onPageChange={(next) => update({ page: next })}
            onLimitChange={(next) => update({ limit: next })}
            disabled={query.isFetching}
          />
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete question?"
        description={<p>“{toDelete?.text}” will no longer be asked.</p>}
        confirmLabel="Delete question"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
