import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Page, PageParams } from '@/lib/api/types'

export interface AuditEntry {
  id: string
  adminId: string
  /** CREATE, UPDATE, DELETE, or a domain action such as BAN, COMPLETE, CONFIRM. */
  action: string
  entityType: string
  entityId: string
  summary: string | null
  createdAt: string
}

export interface AuditLogParams extends PageParams {
  entityType?: string
}

export const auditApi = {
  /** Newest first. Read-only. */
  list: (params: AuditLogParams, signal?: AbortSignal) =>
    api.get<Page<AuditEntry>>('/admin/audit-log', params, { signal }),
}

export const auditKeys = {
  all: ['audit-log'] as const,
  list: (params: AuditLogParams) => [...auditKeys.all, params] as const,
}

export function useAuditLog(params: AuditLogParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: ({ signal }) => auditApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}
