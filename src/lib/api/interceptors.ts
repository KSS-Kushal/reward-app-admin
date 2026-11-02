import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { authEvents } from '@/lib/auth/auth-events'
import { tokenStorage } from '@/lib/auth/token-storage'
import { ApiError, toApiError } from './errors'
import type { ApiResponse } from './types'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Don't attach the bearer token (public endpoints). */
    skipAuth?: boolean
    /** Don't try to refresh the session on 401 (the refresh call itself, logout). */
    skipRefresh?: boolean
    /** Set on the retry after a refresh so a second 401 is final. */
    _retried?: boolean
  }
}

const REFRESH_LOCK = 'kavodnik-admin-token-refresh'

let inFlightRefresh: Promise<string | null> | null = null

/**
 * Exchanges the refresh token for a new pair. The backend rotates refresh tokens and revokes the whole
 * session when an old one is replayed, so concurrent refreshes must never send the same token twice:
 * one refresh per tab at a time (shared promise), and one across tabs (Web Locks).
 * Resolves to the new access token, or null when the session is over.
 */
function refreshAccessToken(client: AxiosInstance, failedToken: string | undefined): Promise<string | null> {
  inFlightRefresh ??= runRefresh(client, failedToken).finally(() => {
    inFlightRefresh = null
  })
  return inFlightRefresh
}

async function runRefresh(client: AxiosInstance, failedToken: string | undefined): Promise<string | null> {
  const refresh = async (): Promise<string | null> => {
    const current = tokenStorage.get()
    if (!current) return null
    // Another tab refreshed while this request was in flight: use its token.
    if (failedToken && current.accessToken !== failedToken) return current.accessToken

    try {
      const response = await client.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        '/auth/refresh',
        { refreshToken: current.refreshToken },
        { skipAuth: true, skipRefresh: true },
      )
      const pair = response.data.data
      if (!pair)
        throw new ApiError({ status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Session expired.' })
      tokenStorage.set(pair)
      return pair.accessToken
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 401) {
        tokenStorage.clear()
        authEvents.emit('session-expired')
        return null
      }
      // Network or server trouble: keep the session, fail this request.
      throw apiError
    }
  }

  if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, refresh)
  }
  return refresh()
}

function bearerOf(config: InternalAxiosRequestConfig): string | undefined {
  const header = config.headers.get('Authorization')
  return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : undefined
}

export function setupInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    if (!config.skipAuth) {
      const token = tokenStorage.getAccessToken()
      if (token) config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config
      const status = error.response?.status

      if (status === 401 && config && !config.skipRefresh && !config._retried && tokenStorage.get()) {
        const token = await refreshAccessToken(client, bearerOf(config))
        if (token) {
          config._retried = true
          config.headers.set('Authorization', `Bearer ${token}`)
          return client.request(config)
        }
      } else if (status === 401 && config && !config.skipRefresh) {
        // Retried request still unauthorized, or no session at all.
        tokenStorage.clear()
        authEvents.emit('session-expired')
      }

      if (status === 403 && config?.url?.startsWith('/admin')) {
        authEvents.emit('forbidden')
      }

      return Promise.reject(toApiError(error))
    },
  )
}
