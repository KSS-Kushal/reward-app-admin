import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UserListParams } from '../types/user.types'
import { usersKeys } from './keys'
import { userApi } from './user.api'

export function useUsers(params: UserListParams, enabled = true) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: ({ signal }) => userApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ''),
    queryFn: ({ signal }) => userApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}
