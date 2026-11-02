import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/features/audit-log/api/audit.api'
import { payoutApi } from '@/features/payouts/api/payout.api'
import { userApi } from '@/features/users/api/user.api'
import { healthApi } from './health.api'

/**
 * The API has no aggregate endpoints, so counts come from `totalItems` of one-item pages.
 * That keeps the dashboard to a handful of tiny requests and every number is real.
 */
export const dashboardKeys = { all: ['dashboard'] as const }

export function useUserCounts() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'users'],
    queryFn: async ({ signal }) => {
      const [all, banned] = await Promise.all([
        userApi.list({ limit: 1 }, signal),
        userApi.list({ limit: 1, status: 'BANNED' }, signal),
      ])
      return { total: all.totalItems, banned: banned.totalItems }
    },
  })
}

export function usePayoutOverview() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'payouts'],
    queryFn: async ({ signal }) => {
      const [pending, completed, failed] = await Promise.all([
        payoutApi.list({ status: 'pending', limit: 5 }, signal),
        payoutApi.list({ status: 'completed', limit: 1 }, signal),
        payoutApi.list({ status: 'failed', limit: 1 }, signal),
      ])
      return {
        oldestPending: pending.items,
        counts: { pending: pending.totalItems, completed: completed.totalItems, failed: failed.totalItems },
      }
    },
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'audit'],
    queryFn: ({ signal }) => auditApi.list({ limit: 8 }, signal),
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'health'],
    queryFn: ({ signal }) => healthApi.check(signal),
    refetchInterval: 60_000,
    retry: false,
  })
}
