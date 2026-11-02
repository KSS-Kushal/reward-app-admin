import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { configApi } from '../api/config.api'
import type { ConfigEntry } from '../types/config.types'
import { CaptchaSection, CheckInSection } from './RewardSections'

vi.mock('../api/config.api', () => ({ configApi: { list: vi.fn(), update: vi.fn() } }))

const checkIn: ConfigEntry = {
  key: 'check_in',
  value: { cycle: [10, 15, 20] },
  description: 'Daily check-in reward cycle.',
  updatedAt: '2026-10-13T09:30:00Z',
}

describe('configuration sections', () => {
  it('edits the check-in cycle and saves the JSON value', async () => {
    const user = userEvent.setup()
    vi.mocked(configApi.update).mockResolvedValue([checkIn])
    renderWithProviders(<CheckInSection entry={checkIn} />)

    const save = screen.getByRole('button', { name: 'Save changes' })
    expect(save).toBeDisabled()

    const day3 = screen.getByLabelText('Day 3')
    await user.clear(day3)
    await user.type(day3, '25')
    await user.click(screen.getByRole('button', { name: 'Add day' }))
    await user.click(save)

    await waitFor(() => expect(configApi.update).toHaveBeenCalledWith('check_in', { cycle: [10, 15, 25, 0] }))
  })

  it('enforces captcha limits before sending', async () => {
    const user = userEvent.setup()
    const captcha: ConfigEntry = {
      key: 'captcha',
      value: { rewardCoins: 5, attemptsPerDay: 5, ttlSeconds: 300, length: 6 },
      description: null,
      updatedAt: '2026-10-13T09:30:00Z',
    }
    renderWithProviders(<CaptchaSection entry={captcha} />)
    const length = screen.getByLabelText('Characters')
    await user.clear(length)
    await user.type(length, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Length must be at most 10.')).toBeInTheDocument()
    expect(configApi.update).not.toHaveBeenCalled()
  })

  it('falls back to read-only for unexpected shapes', () => {
    renderWithProviders(<CheckInSection entry={{ ...checkIn, value: { days: 'weird' } }} />)
    expect(screen.getByText('Read-only')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })
})
