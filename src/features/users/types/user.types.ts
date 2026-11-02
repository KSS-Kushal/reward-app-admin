import type { SearchPageParams } from '@/lib/api/types'

export type UserStatus = 'ACTIVE' | 'BANNED'
export type UserRole = 'USER' | 'ADMIN'

/** Admin user view (`/admin/me`, `/admin/users`). */
export interface AdminUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string | null
  referralCode: string
  status: UserStatus
  role: UserRole
  joinedAt: string
  lastLoginAt: string | null
}

/** `GET /admin/users/{id}`. */
export interface AdminUserDetail {
  user: AdminUser
  balance: number
  totalEarned: number
  pendingCoins: number
  totalRedeemed: number
}

export interface UserListParams extends SearchPageParams {
  status?: UserStatus | ''
}
