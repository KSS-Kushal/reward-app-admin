import { z } from 'zod'
import { slugIdSchema } from '@/lib/forms'

/** Article and merchant categories share this shape. */
export interface Category {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CategoryRequest {
  id?: string
  name: string
  sortOrder: number
}

export const categorySchema = z.object({
  id: slugIdSchema(40),
  name: z.string().trim().min(1, 'Name is required.').max(80, 'Name must be at most 80 characters.'),
  sortOrder: z.number().int('Sort order must be a whole number.').nullable(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
