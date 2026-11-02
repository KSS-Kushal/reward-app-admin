import { z } from 'zod'
import { emptyToNull, httpsUrlSchema, notNull, slugIdSchema } from '@/lib/forms'
import { SUB_ID_PLACEHOLDER } from '@/features/merchants/types/merchant.types'
import { MAX_BULK_PRODUCTS, type Product, type ProductRequest } from '../types/product.types'

function hasAtMostDecimals(value: number, decimals: number): boolean {
  return new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`).test(String(value))
}

export const productSchema = z
  .object({
    id: slugIdSchema(60),
    name: z.string().trim().min(1, 'Name is required.').max(200, 'Name must be at most 200 characters.'),
    imageUrl: z
      .string()
      .nullable()
      .refine((value) => !value || httpsUrlSchema.safeParse(value).success, 'Image URL must be https.'),
    price: z
      .number({ error: 'Price is required.' })
      .min(0, "Price can't be negative.")
      .refine((value) => hasAtMostDecimals(value, 2), 'Price can have at most 2 decimals.')
      .nullable()
      .refine(notNull, 'Price is required.'),
    originalPrice: z
      .number()
      .min(0, "Original price can't be negative.")
      .refine((value) => hasAtMostDecimals(value, 2), 'Original price can have at most 2 decimals.')
      .nullable(),
    currencySymbol: z.string().trim().max(8, 'Currency symbol must be at most 8 characters.'),
    affiliateUrl: z
      .string()
      .trim()
      .min(1, 'Affiliate link is required.')
      .max(2048, 'Affiliate link must be at most 2048 characters.')
      .regex(/^https:\/\/\S+$/, 'Affiliate link must be an https URL.'),
    rating: z
      .number()
      .min(0, 'Rating must be between 0 and 5.')
      .max(5, 'Rating must be between 0 and 5.')
      .refine((value) => hasAtMostDecimals(value, 1), 'Rating can have 1 decimal.')
      .nullable(),
    rewardText: z.string().trim().max(120, 'Reward text must be at most 120 characters.'),
    active: z.boolean(),
    sortOrder: z.number().int('Sort order must be a whole number.').nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.price !== null && values.originalPrice !== null && values.originalPrice < values.price) {
      ctx.addIssue({
        code: 'custom',
        path: ['originalPrice'],
        message: "The original price (MRP) can't be lower than the price.",
      })
    }
  })

export type ProductFormValues = z.infer<typeof productSchema>

export const bulkProductsSchema = z.object({
  products: z
    .array(productSchema)
    .min(1, 'Add at least one product.')
    .max(MAX_BULK_PRODUCTS, `Add at most ${MAX_BULK_PRODUCTS} products at a time.`),
})

export type BulkProductsFormValues = z.infer<typeof bulkProductsSchema>

export function emptyProduct(sortOrder = 0): ProductFormValues {
  return {
    id: '',
    name: '',
    imageUrl: null,
    price: null,
    originalPrice: null,
    currencySymbol: '₹',
    affiliateUrl: '',
    rating: null,
    rewardText: '',
    active: true,
    sortOrder,
  }
}

export function productToForm(product?: Product): ProductFormValues {
  if (!product) return emptyProduct()
  return {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    originalPrice: product.originalPrice,
    currencySymbol: product.currencySymbol,
    affiliateUrl: product.affiliateUrl,
    rating: product.rating,
    rewardText: product.rewardText ?? '',
    active: product.active,
    sortOrder: product.sortOrder,
  }
}

export function formToProductRequest(values: ProductFormValues, isCreate: boolean): ProductRequest {
  return {
    ...(isCreate && values.id ? { id: values.id } : {}),
    name: values.name.trim(),
    imageUrl: values.imageUrl,
    price: values.price ?? 0,
    originalPrice: values.originalPrice,
    currencySymbol: emptyToNull(values.currencySymbol),
    affiliateUrl: values.affiliateUrl.trim(),
    rating: values.rating,
    rewardText: emptyToNull(values.rewardText),
    active: values.active,
    sortOrder: values.sortOrder ?? 0,
  }
}

export const tracksUser = (affiliateUrl: string) => affiliateUrl.includes(SUB_ID_PLACEHOLDER)
