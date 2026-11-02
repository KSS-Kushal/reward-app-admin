import { api } from '@/lib/api/client'
import type { AdminUser } from '@/features/users/types/user.types'
import type { SignInResponse } from '../types/auth.types'

export const authApi = {
  /** `POST /auth/google` (public). */
  signInWithGoogle: (idToken: string) =>
    api.post<SignInResponse>('/auth/google', { idToken }, { skipAuth: true, skipRefresh: true }),

  /** `POST /auth/logout`: revokes this device's session and the current access token. */
  logout: () => api.post<null>('/auth/logout', undefined, { skipRefresh: true }),

  /** `GET /admin/me`: 403 when the signed-in user is not an admin. */
  me: () => api.get<AdminUser>('/admin/me'),
}
