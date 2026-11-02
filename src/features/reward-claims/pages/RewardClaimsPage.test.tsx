import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { rewardClaimApi } from '../api/reward-claim.api'
import type { RewardClaim } from '../types/reward-claim.types'
import { RewardClaimsPage } from './RewardClaimsPage'

vi.mock('../api/reward-claim.api', () => ({ rewardClaimApi: { list: vi.fn(), completeManually: vi.fn() } }))

const claim: RewardClaim = {
  claimId: '9b2f4c1e-5d7a-4e0b-9f3a-2c8d1e6b7a90',
  user: { id: 'user-1', name: 'Ritik Sharma', email: 'ritik@example.com' },
  source: 'checkIn',
  coins: 20,
  status: 'pending',
  adVerified: false,
  adNetwork: null,
  adUnitId: null,
  placement: null,
  adTransactionId: null,
  notVerifiedAttempts: 3,
  createdAt: new Date().toISOString(),
  completedAt: null,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  transactionId: null,
  completedBy: null,
  manualReason: null,
}
const page = (items: RewardClaim[]) => ({
  items,
  currentPage: 1,
  limit: 20,
  totalItems: items.length,
  totalPages: 1,
  isLast: true,
  hasNext: false,
})

describe('RewardClaimsPage', () => {
  beforeEach(() => vi.mocked(rewardClaimApi.list).mockResolvedValue(page([claim])))

  it('passes URL filters to the API', async () => {
    renderWithProviders(<RewardClaimsPage />, {
      path: '/admin/ads/reward-claims',
      route: '/admin/ads/reward-claims?status=pending&adVerified=false&from=2026-10-20',
    })
    expect(await screen.findByText('Ritik Sharma')).toBeInTheDocument()
    expect(rewardClaimApi.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        adVerified: 'false',
        from: '2026-10-20',
        page: 1,
        limit: 20,
      }),
      expect.anything(),
    )
    expect(screen.getByText('(3 retries)')).toBeInTheDocument()
  })

  it('credits a claim manually only with a 5+ character reason', async () => {
    const user = userEvent.setup()
    vi.mocked(rewardClaimApi.completeManually).mockResolvedValue({
      ...claim,
      status: 'completed',
      adNetwork: 'manual',
    })
    renderWithProviders(<RewardClaimsPage />, {
      path: '/admin/ads/reward-claims',
      route: '/admin/ads/reward-claims',
    })

    await user.click(await screen.findByRole('button', { name: 'Claim actions' }))
    await user.click(await screen.findByRole('menuitem', { name: /credit manually/i }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Credit coins' })

    await user.type(within(dialog).getByLabelText('Reason'), 'SSV')
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Reason'), ' outage, ticket #1832')
    await user.click(confirm)

    await waitFor(() =>
      expect(rewardClaimApi.completeManually).toHaveBeenCalledWith(claim.claimId, 'SSV outage, ticket #1832'),
    )
  })

  it('does not offer manual credit for completed claims', async () => {
    const user = userEvent.setup()
    vi.mocked(rewardClaimApi.list).mockResolvedValue(
      page([{ ...claim, status: 'completed', adVerified: true, adNetwork: 'admob' }]),
    )
    renderWithProviders(<RewardClaimsPage />, {
      path: '/admin/ads/reward-claims',
      route: '/admin/ads/reward-claims',
    })
    await user.click(await screen.findByRole('button', { name: 'Claim actions' }))
    expect(await screen.findByRole('menuitem', { name: /view details/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /credit manually/i })).not.toBeInTheDocument()
  })
})
