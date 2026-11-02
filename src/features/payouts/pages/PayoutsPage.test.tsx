import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { payoutApi } from '../api/payout.api'
import type { Payout } from '../types/payout.types'
import { PayoutsPage } from './PayoutsPage'

vi.mock('../api/payout.api', () => ({ payoutApi: { list: vi.fn(), complete: vi.fn(), fail: vi.fn() } }))
vi.mock('@/features/redeem-options/api/redeem-option.api', () => ({
  redeemOptionApi: { list: vi.fn().mockResolvedValue([{ id: 'redeem_upi', name: 'UPI Transfer' }]) },
}))

const payout: Payout = {
  id: 'p1',
  userId: '0199d1c2-aaaa-bbbb-cccc-000000000001',
  optionId: 'redeem_upi',
  coins: 1000,
  accountDetails: 'ritik@upi',
  status: 'pending',
  reference: 'PAYOUT-123',
  providerReference: null,
  failureReason: null,
  createdAt: '2026-10-20T10:00:00Z',
  processedAt: null,
}

const page = (items: Payout[]) => ({
  items,
  currentPage: 1,
  limit: 20,
  totalItems: items.length,
  totalPages: 1,
  isLast: true,
  hasNext: false,
})

describe('PayoutsPage', () => {
  beforeEach(() => {
    vi.mocked(payoutApi.list).mockResolvedValue(page([payout]))
  })

  it('lists pending payouts by default (oldest first, from the API)', async () => {
    renderWithProviders(<PayoutsPage />, { path: '/admin/payouts', route: '/admin/payouts' })
    expect(await screen.findByText('PAYOUT-123')).toBeInTheDocument()
    expect(payoutApi.list).toHaveBeenCalledWith({ status: 'pending', page: 1, limit: 20 }, expect.anything())
    expect(screen.getByText('UPI Transfer')).toBeInTheDocument()
  })

  it('completes a payout with the provider reference', async () => {
    const user = userEvent.setup()
    vi.mocked(payoutApi.complete).mockResolvedValue({
      ...payout,
      status: 'completed',
      providerReference: 'UTR9',
    })
    renderWithProviders(<PayoutsPage />, { path: '/admin/payouts', route: '/admin/payouts' })

    await user.click(await screen.findByRole('button', { name: /complete/i }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Mark as completed' })
    expect(confirm).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Provider reference'), ' UTR9 ')
    await user.click(confirm)

    await waitFor(() => expect(payoutApi.complete).toHaveBeenCalledWith('p1', 'UTR9'))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('fails a payout with a reason and explains the coins are returned', async () => {
    const user = userEvent.setup()
    vi.mocked(payoutApi.fail).mockResolvedValue({
      ...payout,
      status: 'failed',
      failureReason: 'Invalid UPI ID',
    })
    renderWithProviders(<PayoutsPage />, { path: '/admin/payouts', route: '/admin/payouts' })

    await user.click(await screen.findByRole('button', { name: /^fail$/i }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(/returned to the user's wallet/)
    await user.type(within(dialog).getByLabelText('Reason'), 'Invalid UPI ID')
    await user.click(within(dialog).getByRole('button', { name: 'Fail payout' }))

    await waitFor(() => expect(payoutApi.fail).toHaveBeenCalledWith('p1', 'Invalid UPI ID'))
  })

  it('keeps the dialog open when the payout was already settled (409)', async () => {
    const user = userEvent.setup()
    const { ApiError } = await import('@/lib/api/errors')
    vi.mocked(payoutApi.complete).mockRejectedValue(
      new ApiError({ status: 409, code: 'CONFLICT', message: 'This payout is already completed.' }),
    )
    renderWithProviders(<PayoutsPage />, { path: '/admin/payouts', route: '/admin/payouts' })

    await user.click(await screen.findByRole('button', { name: /complete/i }))
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByLabelText('Provider reference'), 'UTR1')
    await user.click(within(dialog).getByRole('button', { name: 'Mark as completed' }))

    await waitFor(() => expect(payoutApi.complete).toHaveBeenCalled())
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
