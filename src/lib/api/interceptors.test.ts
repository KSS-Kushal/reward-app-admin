import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authEvents } from '@/lib/auth/auth-events'
import { tokenStorage } from '@/lib/auth/token-storage'
import { api, apiClient } from './client'
import { ApiError } from './errors'

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data: unknown }

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): Promise<AxiosResponse> {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  if (status >= 400)
    return Promise.reject(new AxiosError('fail', 'ERR_BAD_REQUEST', config, undefined, response))
  return Promise.resolve(response)
}

function useAdapter(handler: Handler) {
  const adapter: AxiosAdapter = async (config) => {
    const { status, data } = handler(config)
    return respond(config, status, data)
  }
  apiClient.defaults.adapter = adapter
}

const envelope = (data: unknown) => ({ success: true, message: 'ok', data })
const bearer = (config: InternalAxiosRequestConfig) => AxiosHeaders.from(config.headers).get('Authorization')

const originalAdapter = apiClient.defaults.adapter

describe('API client auth handling', () => {
  beforeEach(() => {
    tokenStorage.set({ accessToken: 'old-access', refreshToken: 'refresh-1' })
  })
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    tokenStorage.clear()
  })

  it('attaches the bearer token and unwraps the envelope', async () => {
    const seen: (string | undefined)[] = []
    useAdapter((config) => {
      seen.push(String(bearer(config)))
      return { status: 200, data: envelope({ id: 'u1' }) }
    })
    await expect(api.get<{ id: string }>('/admin/me')).resolves.toEqual({ id: 'u1' })
    expect(seen).toEqual(['Bearer old-access'])
  })

  it('refreshes once for concurrent 401s and retries every request', async () => {
    let refreshCalls = 0
    useAdapter((config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1
        expect(JSON.parse(config.data as string)).toEqual({ refreshToken: 'refresh-1' })
        expect(bearer(config)).toBeFalsy()
        return { status: 200, data: envelope({ accessToken: 'new-access', refreshToken: 'refresh-2' }) }
      }
      return bearer(config) === 'Bearer new-access'
        ? { status: 200, data: envelope(config.url) }
        : { status: 401, data: { success: false, message: 'expired', data: null, code: 'UNAUTHORIZED' } }
    })

    const results = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/payouts'),
      api.get('/admin/banners'),
    ])

    expect(results).toEqual(['/admin/users', '/admin/payouts', '/admin/banners'])
    expect(refreshCalls).toBe(1)
    expect(tokenStorage.get()).toEqual({ accessToken: 'new-access', refreshToken: 'refresh-2' })
  })

  it('ends the session when the refresh token is rejected', async () => {
    const onEvent = vi.fn()
    const off = authEvents.on(onEvent)
    useAdapter((config) =>
      config.url === '/auth/refresh'
        ? {
            status: 401,
            data: { success: false, message: 'Session expired', data: null, code: 'INVALID_REFRESH_TOKEN' },
          }
        : { status: 401, data: { success: false, message: 'expired', data: null, code: 'UNAUTHORIZED' } },
    )

    await expect(api.get('/admin/users')).rejects.toBeInstanceOf(ApiError)
    expect(tokenStorage.get()).toBeNull()
    expect(onEvent).toHaveBeenCalledWith('session-expired')
    off()
  })

  it('reports 403 on admin endpoints so the session can be re-verified', async () => {
    const onEvent = vi.fn()
    const off = authEvents.on(onEvent)
    useAdapter(() => ({
      status: 403,
      data: { success: false, message: 'You are not allowed to do this.', data: null, code: 'FORBIDDEN' },
    }))
    await expect(api.post('/admin/users/x/ban')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
    expect(onEvent).toHaveBeenCalledWith('forbidden')
    off()
  })
})
