import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QuizQuestionListParams } from '../types/quiz.types'
import { quizKeys } from './keys'
import { quizApi } from './quiz.api'

export function useQuizQuestions(params: QuizQuestionListParams) {
  return useQuery({
    queryKey: quizKeys.list(params),
    queryFn: ({ signal }) => quizApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useQuizQuestion(id: string | undefined) {
  return useQuery({
    queryKey: quizKeys.detail(id ?? ''),
    queryFn: ({ signal }) => quizApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
