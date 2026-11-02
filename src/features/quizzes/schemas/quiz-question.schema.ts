import { z } from 'zod'
import { httpsUrlSchema, slugIdSchema } from '@/lib/forms'
import {
  ANSWER_TYPES,
  EDITABLE_QUIZ_TYPES,
  type EditableQuizType,
  type QuizQuestion,
  type QuizQuestionRequest,
} from '../types/quiz.types'

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6
export const MAX_ANSWERS = 10

export const quizQuestionSchema = z
  .object({
    id: slugIdSchema(40),
    quizType: z.enum(EDITABLE_QUIZ_TYPES, { error: 'Choose daily or give answer.' }),
    answerType: z.enum(ANSWER_TYPES),
    text: z
      .string()
      .trim()
      .min(1, 'Question text is required.')
      .max(500, 'Question must be at most 500 characters.'),
    imageUrl: z
      .string()
      .nullable()
      .refine((value) => !value || httpsUrlSchema.safeParse(value).success, 'Image URL must be https.'),
    options: z.array(z.object({ text: z.string().max(255, 'Option must be at most 255 characters.') })),
    /** Index of the correct option, or null when none is chosen yet. */
    correctIndex: z.number().int().nullable(),
    acceptedAnswers: z.array(
      z.object({ value: z.string().max(200, 'Answer must be at most 200 characters.') }),
    ),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.answerType === 'singleChoice') {
      if (values.options.length < MIN_OPTIONS || values.options.length > MAX_OPTIONS) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: `Provide ${MIN_OPTIONS} to ${MAX_OPTIONS} options.`,
        })
      }
      values.options.forEach((option, index) => {
        if (!option.text.trim())
          ctx.addIssue({
            code: 'custom',
            path: ['options', index, 'text'],
            message: 'Option text is required.',
          })
      })
      if (values.correctIndex === null || values.correctIndex >= values.options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['correctIndex'],
          message: 'Mark exactly one option as correct.',
        })
      }
    } else {
      if (values.acceptedAnswers.length < 1 || values.acceptedAnswers.length > MAX_ANSWERS) {
        ctx.addIssue({
          code: 'custom',
          path: ['acceptedAnswers'],
          message: `Provide 1 to ${MAX_ANSWERS} accepted answers.`,
        })
      }
      values.acceptedAnswers.forEach((answer, index) => {
        if (!answer.value.trim())
          ctx.addIssue({
            code: 'custom',
            path: ['acceptedAnswers', index, 'value'],
            message: 'Answer is required.',
          })
      })
    }
  })

export type QuizQuestionFormValues = z.infer<typeof quizQuestionSchema>

export function questionToForm(
  question?: QuizQuestion,
  defaultType: EditableQuizType = 'daily',
): QuizQuestionFormValues {
  const quizType: EditableQuizType =
    question?.quizType === 'giveAnswer' ? 'giveAnswer' : question ? 'daily' : defaultType
  const answerType = question?.answerType ?? (quizType === 'giveAnswer' ? 'text' : 'singleChoice')
  const options = question?.options.length
    ? question.options.map((option) => ({ text: option.text }))
    : [{ text: '' }, { text: '' }]
  const correct = question?.options.findIndex((option) => option.isCorrect) ?? -1
  return {
    id: question?.id ?? '',
    quizType,
    answerType,
    text: question?.text ?? '',
    imageUrl: question?.imageUrl ?? null,
    options,
    correctIndex: correct >= 0 ? correct : null,
    acceptedAnswers: question?.acceptedAnswers?.length
      ? question.acceptedAnswers.map((value) => ({ value }))
      : [{ value: '' }],
    active: question?.active ?? true,
  }
}

export function formToQuestionRequest(
  values: QuizQuestionFormValues,
  isCreate: boolean,
): QuizQuestionRequest {
  const base = {
    ...(isCreate && values.id ? { id: values.id } : {}),
    quizType: values.quizType,
    text: values.text.trim(),
    answerType: values.answerType,
    imageUrl: values.imageUrl,
    active: values.active,
  }
  if (values.answerType === 'singleChoice') {
    return {
      ...base,
      options: values.options.map((option, index) => ({
        text: option.text.trim(),
        correct: index === values.correctIndex,
      })),
    }
  }
  return { ...base, acceptedAnswers: values.acceptedAnswers.map((answer) => answer.value.trim()) }
}
