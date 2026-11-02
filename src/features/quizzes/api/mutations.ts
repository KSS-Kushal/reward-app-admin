import { useApiMutation } from '@/hooks/use-api-mutation'
import type { QuizQuestionRequest } from '../types/quiz.types'
import { quizKeys } from './keys'
import { quizApi } from './quiz.api'

export function useCreateQuizQuestion() {
  return useApiMutation({
    mutationFn: (body: QuizQuestionRequest) => quizApi.create(body),
    successMessage: 'Question created successfully.',
    invalidate: [quizKeys.all],
  })
}

export function useUpdateQuizQuestion() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: QuizQuestionRequest }) => quizApi.update(id, body),
    successMessage: 'Question updated successfully.',
    invalidate: [quizKeys.all],
  })
}

export function useDeleteQuizQuestion() {
  return useApiMutation({
    mutationFn: (id: string) => quizApi.remove(id),
    successMessage: 'Question deleted successfully.',
    invalidate: [quizKeys.all],
  })
}
