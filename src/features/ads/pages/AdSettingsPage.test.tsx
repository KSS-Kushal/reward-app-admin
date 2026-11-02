import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderWithProviders } from '@/test/render'
import { adsApi } from '../api/ads.api'
import { adSettingsFixture } from '@/test/fixtures/ads'
import { AdSettingsPage } from './AdSettingsPage'

vi.mock('../api/ads.api', () => ({ adsApi: { getSettings: vi.fn(), saveSettings: vi.fn() } }))

describe('AdSettingsPage', () => {
  beforeEach(() => {
    vi.mocked(adsApi.getSettings).mockResolvedValue({
      ...adSettingsFixture,
      warnings: ['No verified Unity callback in the last 24 hours. Check the S2S callback URL and secret.'],
    })
  })

  it('shows the version, server warnings and copyable callback URLs', async () => {
    renderWithProviders(<AdSettingsPage />)
    expect(await screen.findByText(/Version 7/)).toBeInTheDocument()
    expect(screen.getByText(/No verified Unity callback/)).toBeInTheDocument()
    expect(screen.getByText('https://api.example/ads/callbacks/admob')).toBeInTheDocument()
    expect(screen.getByText('Changes reach users the next time they open the app.')).toBeInTheDocument()
    // Nothing changed yet
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
  })

  it('saves with the loaded version and keeps the Unity secret by default', async () => {
    const user = userEvent.setup()
    vi.mocked(adsApi.saveSettings).mockResolvedValue({ ...adSettingsFixture, version: 8 })
    renderWithProviders(<AdSettingsPage />)

    const cooldown = await screen.findByLabelText('Cooldown between captchas')
    await user.clear(cooldown)
    await user.type(cooldown, '20')
    await user.type(screen.getByLabelText('Change note'), 'Slower captchas')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    await waitFor(() => expect(adsApi.saveSettings).toHaveBeenCalled())
    const body = vi.mocked(adsApi.saveSettings).mock.calls[0]![0]
    expect(body).toMatchObject({ version: 7, note: 'Slower captchas', captcha: { cooldownSeconds: 20 } })
    expect(body.networks.unity.s2sSecret).toBeNull()
  })

  it('shows field errors from the server and offers a reload on a version conflict', async () => {
    const user = userEvent.setup()
    vi.mocked(adsApi.saveSettings)
      .mockRejectedValueOnce(
        new ApiError({
          status: 422,
          code: 'VALIDATION_ERROR',
          message: 'Please fix the highlighted fields.',
          fieldErrors: { 'interstitial.everyScreens': 'Must be between 1 and 50' },
        }),
      )
      .mockRejectedValueOnce(
        new ApiError({
          status: 409,
          code: 'VERSION_CONFLICT',
          message: 'Someone else changed the settings.',
        }),
      )
    renderWithProviders(<AdSettingsPage />)

    const cooldown = await screen.findByLabelText('Cooldown between captchas')
    await user.clear(cooldown)
    await user.type(cooldown, '15')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Must be between 1 and 50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Someone else changed the settings')
    await user.click(within(dialog).getByRole('button', { name: 'Reload settings' }))
    await waitFor(() => expect(adsApi.getSettings).toHaveBeenCalledTimes(2))
  })
})
