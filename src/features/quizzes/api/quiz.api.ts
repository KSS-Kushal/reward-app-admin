import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { QuizQuestion, QuizQuestionListParams, QuizQuestionRequest } from '../types/quiz.types'

const path = (id: string) => `/admin/quiz-questions/${encodeURIComponent(id)}`

export const quizApi = {
  list: (params: QuizQuestionListParams, signal?: AbortSignal) =>
    api.get<Page<QuizQuestion>>('/admin/quiz-questions', params, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<QuizQuestion>(path(id), undefined, { signal }),
  create: (body: QuizQuestionRequest) => api.post<QuizQuestion>('/admin/quiz-questions', body),
  update: (id: string, body: QuizQuestionRequest) => api.put<QuizQuestion>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}
