import axios, { type AxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { setupInterceptors } from './interceptors'
import type { ApiResponse } from './types'

/** The one Axios instance of the app. Feature API modules use the `api` helpers below, never Axios directly. */
export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
})

setupInterceptors(apiClient)

/** Query params with empty values removed, so `?q=&status=` is never sent. */
export function cleanParams<T extends object>(params: T | undefined): Partial<T> | undefined {
  if (!params) return undefined
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return Object.fromEntries(entries) as Partial<T>
}

async function send<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config)
  // `data` is null for DELETE and other bodiless successes; callers typed those as `null`/`void`.
  return response.data.data as T
}

/** Envelope-aware helpers: resolve to the envelope's `data`, reject with an ApiError. */
export const api = {
  get<T>(url: string, params?: object, config?: AxiosRequestConfig) {
    return send<T>({ ...config, method: 'GET', url, params: cleanParams(params) })
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return send<T>({ ...config, method: 'POST', url, data: body })
  },
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return send<T>({ ...config, method: 'PUT', url, data: body })
  },
  delete(url: string, config?: AxiosRequestConfig) {
    return send<null>({ ...config, method: 'DELETE', url })
  },
}
