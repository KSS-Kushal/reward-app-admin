import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { env } from '@/lib/env'

export type HealthStatus = 'UP' | 'DOWN' | 'UNREACHABLE'

/**
 * Spring Boot actuator, outside /api/v1 and outside the envelope. Details are hidden by the backend,
 * so only the overall status is available; readiness covers PostgreSQL and Redis.
 */
async function probe(url: string, signal?: AbortSignal): Promise<HealthStatus> {
  try {
    const response = await apiClient.get<{ status?: string }>(url, {
      baseURL: '',
      signal,
      skipAuth: true,
      skipRefresh: true,
      timeout: 8_000,
    })
    return response.data.status === 'UP' ? 'UP' : 'DOWN'
  } catch (error) {
    // Actuator answers 503 with {"status":"DOWN"} when a dependency is down.
    return toApiError(error).status === 503 ? 'DOWN' : 'UNREACHABLE'
  }
}

export const healthApi = {
  check: async (signal?: AbortSignal) => {
    const [api, readiness] = await Promise.all([
      probe(env.HEALTH_URL, signal),
      probe(`${env.HEALTH_URL}/readiness`, signal),
    ])
    return { api, readiness }
  },
}
