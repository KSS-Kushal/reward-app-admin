import type { QuizQuestionListParams } from '../types/quiz.types'

export const quizKeys = {
  all: ['quiz-questions'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (params: QuizQuestionListParams) => [...quizKeys.lists(), params] as const,
  detail: (id: string) => [...quizKeys.all, 'detail', id] as const,
}
