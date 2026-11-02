import { useApiMutation } from '@/hooks/use-api-mutation'
import type { UserRole } from '../types/user.types'
import { usersKeys } from './keys'
import { userApi } from './user.api'

const affected = (id: string) => [usersKeys.lists(), usersKeys.detail(id)]

export function useBanUser() {
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => userApi.ban(id, reason),
    successMessage: 'User banned successfully.',
    invalidate: (_data, { id }) => affected(id),
  })
}

export function useUnbanUser() {
  return useApiMutation({
    mutationFn: (id: string) => userApi.unban(id),
    successMessage: 'User unbanned successfully.',
    invalidate: (_data, id) => affected(id),
  })
}

export function useUpdateUserRole() {
  return useApiMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => userApi.updateRole(id, role),
    successMessage: (user) => `${user.name} is now ${user.role === 'ADMIN' ? 'an admin' : 'a regular user'}.`,
    invalidate: (_data, { id }) => affected(id),
  })
}
