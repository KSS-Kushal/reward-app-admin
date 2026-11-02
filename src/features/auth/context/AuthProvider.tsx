import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toApiError } from '@/lib/api/errors'
import { authEvents } from '@/lib/auth/auth-events'
import { tokenStorage } from '@/lib/auth/token-storage'
import type { AdminUser } from '@/features/users/types/user.types'
import { authApi } from '../api/auth.api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

/**
 * Owns the admin session. A session counts as authenticated only after `GET /admin/me` succeeds,
 * which the backend allows for the ADMIN role alone. The backend stays the authority on every request.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'initializing' : 'signed-out'))
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null)
  const verifying = useRef<Promise<void> | null>(null)

  const endSession = useCallback(
    (next: AuthStatus) => {
      tokenStorage.clear()
      queryClient.clear()
      setAdmin(null)
      setStatus(next)
    },
    [queryClient],
  )

  /** Not an admin: revoke the session server-side too, then show the unauthorized page. */
  const reject = useCallback(
    async (email: string | null) => {
      setRejectedEmail(email)
      try {
        await authApi.logout()
      } catch {
        // The tokens are discarded locally either way.
      }
      endSession('forbidden')
    },
    [endSession],
  )

  const verify = useCallback(
    (emailHint: string | null = null) => {
      verifying.current ??= (async () => {
        try {
          const me = await authApi.me()
          if (me.role !== 'ADMIN') {
            await reject(me.email)
            return
          }
          setAdmin(me)
          setRejectedEmail(null)
          setStatus('authenticated')
        } catch (error) {
          const apiError = toApiError(error)
          if (apiError.status === 403) await reject(emailHint ?? admin?.email ?? null)
          else if (apiError.status === 401) endSession('signed-out')
          else setStatus('unreachable')
        } finally {
          verifying.current = null
        }
      })()
      return verifying.current
    },
    [admin?.email, endSession, reject],
  )

  // Verify a stored session once on startup.
  const startupChecked = useRef(false)
  useEffect(() => {
    if (startupChecked.current) return
    startupChecked.current = true
    if (tokenStorage.get()) void verify()
  }, [verify])

  // React to the HTTP layer and to other tabs.
  useEffect(() => {
    const offEvents = authEvents.on((event) => {
      if (event === 'session-expired') endSession('signed-out')
      // A 403 on an admin endpoint may be a business rule (e.g. banning yourself) or a lost ADMIN role;
      // re-checking /admin/me tells them apart.
      if (event === 'forbidden' && tokenStorage.get()) void verify()
    })
    const offStorage = tokenStorage.subscribe((tokens) => {
      if (!tokens) {
        queryClient.clear()
        setAdmin(null)
        setStatus((current) => (current === 'forbidden' ? current : 'signed-out'))
      }
    })
    return () => {
      offEvents()
      offStorage()
    }
  }, [endSession, queryClient, verify])

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await authApi.signInWithGoogle(idToken)
      tokenStorage.set({ accessToken: response.accessToken, refreshToken: response.refreshToken })
      setStatus('initializing')
      await verify(response.user.email)
    },
    [verify],
  )

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Already expired or offline: still sign out locally.
    }
    setRejectedEmail(null)
    endSession('signed-out')
  }, [endSession])

  const retry = useCallback(() => {
    if (!tokenStorage.get()) {
      setStatus('signed-out')
      return
    }
    setStatus('initializing')
    void verify()
  }, [verify])

  const value = useMemo<AuthContextValue>(
    () => ({ status, admin, rejectedEmail, signInWithGoogle, signOut, retry }),
    [status, admin, rejectedEmail, signInWithGoogle, signOut, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
