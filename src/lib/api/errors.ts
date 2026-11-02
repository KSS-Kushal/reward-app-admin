import { isAxiosError } from 'axios'
import type { ApiResponse } from './types'

/** Error codes the backend sends in the envelope's `code`, plus NETWORK_ERROR for unreachable servers. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'IN_USE'
  | 'INVALID_FILE'
  | 'INVALID_GOOGLE_TOKEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'ACCOUNT_BANNED'
  | 'NETWORK_ERROR'
  | (string & {})

/** A normalized API failure. Every rejected request made through the API client is an ApiError. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fieldErrors: Record<string, string>

  constructor(params: {
    status: number
    code: ApiErrorCode
    message: string
    fieldErrors?: Record<string, string>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors ?? {}
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0
  }
}

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
}

/** Copy that replaces the backend message for these statuses. */
const STATUS_MESSAGES: Partial<Record<number, string>> = {
  429: 'Too many requests. Please try again later.',
  503: 'Service temporarily unavailable.',
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

function isEnvelope(value: unknown): value is ApiResponse<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value && 'message' in value
}

/** Turns anything thrown by Axios (or our own code) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    const response = error.response
    if (!response) {
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection and try again.',
      })
    }
    const status = response.status
    const body: unknown = response.data
    if (isEnvelope(body)) {
      return new ApiError({
        status,
        code: body.code ?? STATUS_CODES[status] ?? 'INTERNAL_ERROR',
        message: STATUS_MESSAGES[status] ?? (body.message || GENERIC_MESSAGE),
        fieldErrors: body.errors ?? {},
      })
    }
    return new ApiError({
      status,
      code: STATUS_CODES[status] ?? 'INTERNAL_ERROR',
      message:
        STATUS_MESSAGES[status] ??
        (status === 403 ? "You don't have permission to perform this action." : GENERIC_MESSAGE),
    })
  }

  if (error instanceof Error) {
    return new ApiError({ status: 0, code: 'INTERNAL_ERROR', message: error.message || GENERIC_MESSAGE })
  }
  return new ApiError({ status: 0, code: 'INTERNAL_ERROR', message: GENERIC_MESSAGE })
}

/** The message to show for a failed action. */
export function getErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  return toApiError(error).message || fallback
}

export function hasStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status
}

/** Backend field keys use bracket indices (`products[2].price`); React Hook Form uses dots (`products.2.price`). */
export function toFormPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, '.$1')
}
