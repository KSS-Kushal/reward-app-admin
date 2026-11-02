import { z } from 'zod'
import { isAppRoute } from '@/lib/app-routes'
import { emptyToNull, hexColorSchema, httpsUrlSchema, slugIdSchema } from '@/lib/forms'
import type { Banner, BannerRequest } from '../types/banner.types'

export const bannerSchema = z
  .object({
    id: slugIdSchema(60),
    title: z.string().trim().min(1, 'Title is required.').max(160),
    subtitle: z.string().max(255),
    imageUrl: z.string().nullable(),
    tag: z.string().max(20, 'Tag must be at most 20 characters.'),
    actionRoute: z
      .string()
      .trim()
      .max(255)
      .refine((value) => value === '' || isAppRoute(value), {
        message: 'Choose a route that exists in the app.',
      }),
    actionUrl: z
      .string()
      .trim()
      .max(1024)
      .refine((value) => value === '' || /^https?:\/\/.+/.test(value), {
        message: 'Must be a web link (http or https).',
      }),
    useGradient: z.boolean(),
    gradientStart: z.string(),
    gradientEnd: z.string(),
    priority: z.number().int('Priority must be a whole number.').nullable(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.useGradient) {
      for (const key of ['gradientStart', 'gradientEnd'] as const) {
        if (!hexColorSchema.safeParse(values[key]).success) {
          ctx.addIssue({ code: 'custom', path: [key], message: 'Use a #RRGGBB colour.' })
        }
      }
    }
    if (values.imageUrl && !httpsUrlSchema.safeParse(values.imageUrl).success) {
      ctx.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Image URL must be https.' })
    }
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time must be after the start time.' })
    }
  })

export type BannerFormValues = z.infer<typeof bannerSchema>

export function bannerToForm(banner?: Banner): BannerFormValues {
  return {
    id: banner?.id ?? '',
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    imageUrl: banner?.imageUrl ?? null,
    tag: banner?.tag ?? '',
    actionRoute: banner?.actionRoute ?? '',
    actionUrl: banner?.actionUrl ?? '',
    useGradient: Boolean(banner?.gradient) || !banner,
    gradientStart: banner?.gradient?.[0] ?? '#EDE9FE',
    gradientEnd: banner?.gradient?.[1] ?? '#C9BCF7',
    priority: banner?.priority ?? 0,
    startsAt: banner?.startsAt ?? null,
    endsAt: banner?.endsAt ?? null,
    active: banner?.active ?? true,
  }
}

export function formToBannerRequest(values: BannerFormValues, isCreate: boolean): BannerRequest {
  return {
    ...(isCreate && values.id ? { id: values.id } : {}),
    title: values.title.trim(),
    subtitle: emptyToNull(values.subtitle),
    imageUrl: values.imageUrl || null,
    tag: emptyToNull(values.tag),
    actionRoute: emptyToNull(values.actionRoute),
    actionUrl: emptyToNull(values.actionUrl),
    gradient: values.useGradient
      ? [values.gradientStart.toUpperCase(), values.gradientEnd.toUpperCase()]
      : null,
    priority: values.priority ?? 0,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    active: values.active,
  }
}

export type ScheduleState = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED'

/** Whether the app currently shows the banner, for display only. */
export function bannerScheduleState(
  banner: Pick<Banner, 'active' | 'startsAt' | 'endsAt'>,
  now = Date.now(),
): ScheduleState {
  if (!banner.active) return 'INACTIVE'
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return 'SCHEDULED'
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return 'EXPIRED'
  return 'ACTIVE'
}
