import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage, toApiError, toFormPath } from './errors'

function axiosError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response)
}

describe('toApiError', () => {
  it('reads the envelope: message, code and field errors', () => {
    const error = toApiError(
      axiosError(422, {
        success: false,
        message: 'Please enter a valid phone number.',
        data: null,
        errors: { phone: 'Please enter a valid phone number.' },
        code: 'VALIDATION_ERROR',
      }),
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Please enter a valid phone number.')
    expect(error.fieldErrors).toEqual({ phone: 'Please enter a valid phone number.' })
    expect(error.hasFieldErrors).toBe(true)
  })

  it('keeps business codes such as IN_USE', () => {
    const error = toApiError(
      axiosError(409, {
        success: false,
        message: 'This image is still used by banner_x.',
        data: null,
        code: 'IN_USE',
      }),
    )
    expect(error.code).toBe('IN_USE')
    expect(error.message).toBe('This image is still used by banner_x.')
  })

  it('uses friendly copy for 429 and 503', () => {
    expect(
      toApiError(axiosError(429, { success: false, message: 'slow down', data: null, code: 'RATE_LIMITED' }))
        .message,
    ).toBe('Too many requests. Please try again later.')
    expect(toApiError(axiosError(503, { success: false, message: 'x', data: null })).message).toBe(
      'Service temporarily unavailable.',
    )
  })

  it('handles non-envelope bodies and network failures', () => {
    expect(toApiError(axiosError(404, '<html>')).code).toBe('NOT_FOUND')
    expect(toApiError(axiosError(403, null)).message).toBe(
      "You don't have permission to perform this action.",
    )
    const network = toApiError(
      new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() }),
    )
    expect(network.code).toBe('NETWORK_ERROR')
    expect(network.status).toBe(0)
  })

  it('getErrorMessage falls back for unknown errors', () => {
    expect(getErrorMessage('boom')).toBe('Something went wrong. Please try again.')
  })
})

describe('toFormPath', () => {
  it('converts bulk error keys to React Hook Form paths', () => {
    expect(toFormPath('products[2].originalPrice')).toBe('products.2.originalPrice')
    expect(toFormPath('title')).toBe('title')
  })
})
