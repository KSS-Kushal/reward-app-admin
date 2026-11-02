/** Typed access to the Vite environment. Only public values belong here: everything is shipped to the browser. */
function required(name: string, value: string | undefined): string {
  const resolved = value?.trim()
  if (!resolved) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`)
  }
  return resolved
}

const apiBaseUrl = required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '')

/** Actuator lives outside /api/v1 on the same server: <origin>/actuator/health. */
function healthUrl(base: string): string {
  if (/^https?:\/\//i.test(base)) {
    return `${new URL(base).origin}/actuator/health`
  }
  return '/actuator/health'
}

export const env = {
  API_BASE_URL: apiBaseUrl,
  HEALTH_URL: healthUrl(apiBaseUrl),
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '',
  IS_DEV: import.meta.env.DEV,
} as const
