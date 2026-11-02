import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, testAdmin } from '@/test/render'
import { userApi } from '../api/user.api'
import type { AdminUser } from '../types/user.types'
import { UserDetailsPage } from './UserDetailsPage'

vi.mock('../api/user.api', () => ({
  userApi: { getById: vi.fn(), ban: vi.fn(), unban: vi.fn(), updateRole: vi.fn(), list: vi.fn() },
}))

const member: AdminUser = {
  ...testAdmin,
  id: 'user-2',
  name: 'Ritik Sharma',
  email: 'ritik@example.com',
  role: 'USER',
  referralCode: 'RITIK250',
}
const detail = (user: AdminUser) => ({
  user,
  balance: 2450,
  totalEarned: 3450,
  pendingCoins: 340,
  totalRedeemed: 1000,
})

describe('UserDetailsPage', () => {
  beforeEach(() => vi.mocked(userApi.getById).mockResolvedValue(detail(member)))

  it('shows profile and wallet totals', async () => {
    renderWithProviders(<UserDetailsPage />, { path: '/admin/users/:id', route: '/admin/users/user-2' })
    expect(await screen.findByRole('heading', { name: /Ritik Sharma/ })).toBeInTheDocument()
    expect(screen.getByText('2,450')).toBeInTheDocument()
    expect(screen.getByText('3,450')).toBeInTheDocument()
  })

  it('bans a user with an optional reason after confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(userApi.ban).mockResolvedValue({ ...member, status: 'BANNED' })
    renderWithProviders(<UserDetailsPage />, { path: '/admin/users/:id', route: '/admin/users/user-2' })

    await user.click(await screen.findByRole('button', { name: /ban user/i }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('This will end all active sessions for this user.')
    expect(userApi.ban).not.toHaveBeenCalled()

    await user.type(within(dialog).getByLabelText(/reason/i), 'Fraud')
    await user.click(within(dialog).getByRole('button', { name: 'Ban user' }))
    await waitFor(() => expect(userApi.ban).toHaveBeenCalledWith('user-2', 'Fraud'))
  })

  it('disables ban and role changes on your own account', async () => {
    vi.mocked(userApi.getById).mockResolvedValue(detail(testAdmin))
    renderWithProviders(<UserDetailsPage />, {
      path: '/admin/users/:id',
      route: `/admin/users/${testAdmin.id}`,
    })
    expect(await screen.findByRole('button', { name: /ban user/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /remove admin/i })).toBeDisabled()
  })
})
