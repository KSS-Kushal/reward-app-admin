import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/types'
import type { AdminUser, AdminUserDetail, UserListParams, UserRole } from '../types/user.types'

const path = (id: string) => `/admin/users/${encodeURIComponent(id)}`

export const userApi = {
  list: (params: UserListParams, signal?: AbortSignal) =>
    api.get<Page<AdminUser>>('/admin/users', params, { signal }),
  getById: (id: string, signal?: AbortSignal) => api.get<AdminUserDetail>(path(id), undefined, { signal }),
  /** Ends all of the user's sessions. 403 when banning yourself. */
  ban: (id: string, reason: string | null) =>
    api.post<AdminUser>(`${path(id)}/ban`, reason ? { reason } : {}),
  unban: (id: string) => api.post<AdminUser>(`${path(id)}/unban`),
  updateRole: (id: string, role: UserRole) => api.put<AdminUser>(`${path(id)}/role`, { role }),
}
