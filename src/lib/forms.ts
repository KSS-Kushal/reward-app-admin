import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { toApiError, toFormPath } from '@/lib/api/errors'

/**
 * Shows the backend's field errors (`errors` in the envelope) on the matching form fields.
 * `fieldMap` renames backend keys that differ from the form's field names.
 * Returns true when at least one field error was applied.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fieldMap: Record<string, string> = {},
): boolean {
  const apiError = toApiError(error)
  let applied = false
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    const path = fieldMap[field] ?? toFormPath(field)
    form.setError(path as Path<T>, { type: 'server', message }, { shouldFocus: !applied })
    applied = true
  }
  return applied
}

/** Empty strings in optional text fields are sent as null. */
export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Ids accepted by the backend: 2–60 lowercase letters, digits, '-' or '_', starting alphanumeric. */
export function slugIdSchema(maxLength = 60) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || new RegExp(`^[a-z0-9][a-z0-9_-]{1,${maxLength - 1}}$`).test(value), {
      message: `Use 2–${maxLength} lowercase letters, digits, '-' or '_'. Leave empty to generate one.`,
    })
}

export const httpsUrlSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https:\/\/\S+$/.test(value), { message: 'Must be an https:// URL.' })

export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a #RRGGBB colour.')

/**
 * "Required" check for nullable number inputs. Declared as returning plain `boolean` (not a type predicate)
 * so Zod keeps the form's input and output types identical.
 */
export const notNull = (value: unknown): boolean => value !== null
