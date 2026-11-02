import { z } from 'zod'
import { emptyToNull, httpsUrlSchema, slugIdSchema } from '@/lib/forms'
import { ARTICLE_STATUSES, type Article, type ArticleRequest } from '../types/article.types'

export const CONTENT_MAX = 100_000

export const articleSchema = z.object({
  id: slugIdSchema(60),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title must be at most 200 characters.'),
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required.')
    .max(500, 'Summary must be at most 500 characters.'),
  content: z.string().trim().min(1, 'Content is required.').max(CONTENT_MAX, 'Content is too long.'),
  categoryId: z.string().min(1, 'Category is required.'),
  author: z.string().max(120),
  publishedAt: z.string().nullable(),
  readTimeMinutes: z
    .number()
    .int('Use whole minutes.')
    .min(1, 'Read time must be at least 1 minute.')
    .nullable(),
  imageUrl: z
    .string()
    .nullable()
    .refine((value) => !value || httpsUrlSchema.safeParse(value).success, 'Image URL must be https.'),
  rewardCoins: z.number().int('Coins are whole numbers.').min(0, "Reward can't be negative.").nullable(),
  requiredReadSeconds: z
    .number()
    .int('Use whole seconds.')
    .min(0, "Required reading time can't be negative.")
    .nullable(),
  status: z.enum(ARTICLE_STATUSES),
})

export type ArticleFormValues = z.infer<typeof articleSchema>

export function articleToForm(article?: Article): ArticleFormValues {
  return {
    id: article?.id ?? '',
    title: article?.title ?? '',
    summary: article?.summary ?? '',
    content: article?.content ?? '',
    categoryId: article?.categoryId ?? '',
    author: article?.author ?? '',
    publishedAt: article?.publishedAt ?? null,
    readTimeMinutes: article?.readTimeMinutes ?? null,
    imageUrl: article?.imageUrl ?? null,
    rewardCoins: article?.rewardCoins ?? 0,
    requiredReadSeconds: article?.requiredReadSeconds ?? null,
    status: article?.status ?? 'DRAFT',
  }
}

/** Normalizes line endings and collapses runs of blank lines so paragraphs are exactly `\n\n` apart. */
export function normalizeContent(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function splitParagraphs(content: string): string[] {
  return normalizeContent(content).split('\n\n').filter(Boolean)
}

export function countWords(content: string): number {
  const words = content.trim().match(/\S+/g)
  return words ? words.length : 0
}

export function formToArticleRequest(values: ArticleFormValues, isCreate: boolean): ArticleRequest {
  return {
    ...(isCreate && values.id ? { id: values.id } : {}),
    title: values.title.trim(),
    summary: values.summary.trim(),
    content: normalizeContent(values.content),
    categoryId: values.categoryId,
    author: emptyToNull(values.author),
    publishedAt: values.publishedAt,
    readTimeMinutes: values.readTimeMinutes,
    imageUrl: values.imageUrl,
    rewardCoins: values.rewardCoins,
    requiredReadSeconds: values.requiredReadSeconds,
    status: values.status,
  }
}
