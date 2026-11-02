import { z } from 'zod'
import { emptyToNull, hexColorSchema, httpsUrlSchema, notNull, slugIdSchema } from '@/lib/forms'
import { SUB_ID_PLACEHOLDER, type Merchant, type MerchantRequest } from '../types/merchant.types'

export const MAX_TERMS = 20

export const merchantSchema = z.object({
  id: slugIdSchema(60),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  categoryId: z.string().min(1, 'Category is required.'),
  rewardText: z.string().trim().min(1, 'Reward text is required.').max(120),
  cashbackPercent: z
    .number({ error: 'Cashback percent is required.' })
    .min(0, 'Cashback must be between 0 and 100.')
    .max(100, 'Cashback must be between 0 and 100.')
    .nullable()
    .refine(notNull, 'Cashback percent is required.'),
  description: z.string().trim().min(1, 'Description is required.').max(1000),
  trackingUrlTemplate: z
    .string()
    .trim()
    .min(1, 'Tracking URL is required.')
    .max(1024)
    .refine((value) => httpsUrlSchema.safeParse(value).success && value !== '', 'Tracking URL must be https.')
    .refine(
      (value) => value.includes(SUB_ID_PLACEHOLDER),
      `The tracking URL must contain ${SUB_ID_PLACEHOLDER} so cashback can be attributed to the user.`,
    ),
  brandColor: z
    .string()
    .refine(
      (value) => value === '' || hexColorSchema.safeParse(value).success,
      'Brand colour must be #RRGGBB.',
    ),
  logoUrl: z.string().nullable(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().nullable(),
  terms: z
    .array(z.object({ value: z.string().max(300, 'Each term must be at most 300 characters.') }))
    .max(MAX_TERMS, `At most ${MAX_TERMS} terms.`),
})

export type MerchantFormValues = z.infer<typeof merchantSchema>

export function merchantToForm(merchant?: Merchant): MerchantFormValues {
  return {
    id: merchant?.id ?? '',
    name: merchant?.name ?? '',
    categoryId: merchant?.categoryId ?? '',
    rewardText: merchant?.rewardText ?? '',
    cashbackPercent: merchant?.cashbackPercent ?? null,
    description: merchant?.description ?? '',
    trackingUrlTemplate: merchant?.trackingUrlTemplate ?? '',
    brandColor: merchant?.brandColor ?? '',
    logoUrl: merchant?.logoUrl ?? null,
    featured: merchant?.featured ?? false,
    active: merchant?.active ?? true,
    sortOrder: merchant?.sortOrder ?? 0,
    terms: (merchant?.terms ?? ['Cashback is tracked only when you visit the store from Kavodnik.']).map(
      (value) => ({ value }),
    ),
  }
}

export function formToMerchantRequest(values: MerchantFormValues, isCreate: boolean): MerchantRequest {
  return {
    ...(isCreate && values.id ? { id: values.id } : {}),
    name: values.name.trim(),
    categoryId: values.categoryId,
    rewardText: values.rewardText.trim(),
    cashbackPercent: values.cashbackPercent ?? 0,
    description: values.description.trim(),
    trackingUrlTemplate: values.trackingUrlTemplate.trim(),
    brandColor: emptyToNull(values.brandColor)?.toUpperCase() ?? null,
    logoUrl: values.logoUrl,
    featured: values.featured,
    active: values.active,
    sortOrder: values.sortOrder ?? 0,
    terms: values.terms.map((term) => term.value.trim()).filter(Boolean),
  }
}

/** Shows how a link will look for a user, e.g. with `sub=<affiliate id>`. */
export function previewTrackingUrl(template: string, sample = 'USER_AFFILIATE_ID'): string {
  return template.split(SUB_ID_PLACEHOLDER).join(sample)
}
