/**
 * Session tokens. The backend issues bearer tokens in the response body (no httpOnly cookie), so they
 * must live in browser storage. They are kept in one localStorage entry so every tab shares the same
 * session and sees refreshes made by other tabs. Never log these values.
 */
export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

const STORAGE_KEY = 'kavodnik.admin.session'

type Listener = (tokens: SessionTokens | null) => void

let cache: SessionTokens | null | undefined
const listeners = new Set<Listener>()

function parse(raw: string | null): SessionTokens | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      typeof value === 'object' &&
      value !== null &&
      'accessToken' in value &&
      'refreshToken' in value &&
      typeof value.accessToken === 'string' &&
      typeof value.refreshToken === 'string'
    ) {
      return { accessToken: value.accessToken, refreshToken: value.refreshToken }
    }
  } catch {
    // Corrupt entry: treat as signed out.
  }
  return null
}

function readStorage(): SessionTokens | null {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function notify(tokens: SessionTokens | null) {
  listeners.forEach((listener) => listener(tokens))
}

export const tokenStorage = {
  /** Always reads storage so a refresh made by another tab is picked up. */
  get(): SessionTokens | null {
    cache = readStorage()
    return cache
  },

  getAccessToken(): string | null {
    return this.get()?.accessToken ?? null
  },

  set(tokens: SessionTokens) {
    cache = tokens
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    } catch {
      // Storage unavailable (private mode quota): the session lasts for this page only.
    }
    notify(tokens)
  },

  clear() {
    cache = null
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    notify(null)
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

// Sign-out or sign-in in another tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    const next = parse(event.newValue)
    const hadSession = cache != null
    cache = next
    if (!next && hadSession) notify(null)
  })
}
