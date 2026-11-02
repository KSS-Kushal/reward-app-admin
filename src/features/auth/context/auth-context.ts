import { createContext, useContext } from 'react'
import type { AdminUser } from '@/features/users/types/user.types'

export type AuthStatus =
  /** Checking a stored session on startup. */
  | 'initializing'
  | 'signed-out'
  /** Signed in with an account that is not an admin. */
  | 'forbidden'
  /** The API could not be reached while verifying the session. */
  | 'unreachable'
  | 'authenticated'

export interface AuthContextValue {
  status: AuthStatus
  admin: AdminUser | null
  /** Email of the non-admin account that was rejected, for the unauthorized page. */
  rejectedEmail: string | null
  signInWithGoogle: (idToken: string) => Promise<void>
  signOut: () => Promise<void>
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.')
  return context
}
