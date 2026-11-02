import { describe, expect, it } from 'vitest'
import { adSettingsFixture } from '@/test/fixtures/ads'
import {
  adSettingsSchema,
  formToSaveRequest,
  fullPlacements,
  settingsToForm,
  sharePreview,
  verificationLooksBroken,
} from './ad-settings.schema'

const errorsOf = (values: unknown) => {
  const result = adSettingsSchema.safeParse(values)
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]),
  )
}

describe('ad settings form', () => {
  it('fills every placement switch, defaulting missing ones to on', () => {
    expect(fullPlacements({ quiz: { native: false } })).toEqual({
      captcha: { banner: true },
      quiz: { banner: true, native: false },
      article: { banner: true, native: true },
      screenChange: { interstitial: true },
    })
  })

  it('round-trips loaded settings into the PUT body with the loaded version', () => {
    const body = formToSaveRequest(settingsToForm(adSettingsFixture), adSettingsFixture.version)
    expect(body.version).toBe(7)
    expect(body.note).toBeNull()
    expect(body.networks.admob.rewardedId).toBe('ca-app-pub-1234567890123456/1111111111')
    expect(body.placements.article).toEqual({ banner: true, native: true })
    expect(body).not.toHaveProperty('callbackUrls')
    expect(body.networks.unity).not.toHaveProperty('hasS2sSecret')
  })

  it('sends the Unity secret as null to keep, "" to clear, or the new value', () => {
    const form = settingsToForm(adSettingsFixture)
    expect(formToSaveRequest(form, 7).networks.unity.s2sSecret).toBeNull()
    const clear = {
      ...form,
      networks: { ...form.networks, unity: { ...form.networks.unity, clearSecret: true } },
    }
    expect(formToSaveRequest(clear, 7).networks.unity.s2sSecret).toBe('')
    const replace = {
      ...form,
      networks: { ...form.networks, unity: { ...form.networks.unity, s2sSecret: ' new-secret ' } },
    }
    expect(formToSaveRequest(replace, 7).networks.unity.s2sSecret).toBe('new-secret')
  })

  it('validates AdMob unit ids, Unity ids and numeric ranges like the backend', () => {
    const form = settingsToForm(adSettingsFixture)
    const errors = errorsOf({
      ...form,
      networks: {
        admob: { ...form.networks.admob, rewardedId: 'ca-app-pub-123/1' },
        unity: { ...form.networks.unity, gameId: 'abc', bannerId: '' },
      },
      interstitial: { ...form.interstitial, everyScreens: 0 },
      rewardedLoadTimeoutSeconds: 40,
    })
    expect(errors['networks.admob.rewardedId']).toBe('Not a valid AdMob ad unit id')
    expect(errors['networks.unity.gameId']).toBe('Digits only')
    expect(errors['networks.unity.bannerId']).toBe('Required when Unity is enabled')
    expect(errors['interstitial.everyScreens']).toBe('Must be between 1 and 50')
    expect(errors.rewardedLoadTimeoutSeconds).toBe('Must be between 3 and 30')
  })

  it('needs a usable rewarded network while ads are enabled', () => {
    const form = settingsToForm(adSettingsFixture)
    const errors = errorsOf({
      ...form,
      networks: {
        admob: { ...form.networks.admob, weight: 0 },
        unity: { ...form.networks.unity, enabled: false },
      },
    })
    expect(errors.networks).toMatch(/at least one network/)
    // ...but not when ads are off
    expect(
      errorsOf({
        ...form,
        enabled: false,
        networks: {
          admob: { ...form.networks.admob, weight: 0 },
          unity: { ...form.networks.unity, enabled: false },
        },
      }).networks,
    ).toBeUndefined()
  })

  it('blocks required verification when Unity would have no secret', () => {
    const form = settingsToForm({
      ...adSettingsFixture,
      networks: {
        ...adSettingsFixture.networks,
        unity: { ...adSettingsFixture.networks.unity, hasS2sSecret: false },
      },
    })
    expect(errorsOf(form)['rewards.requireAdVerification']).toMatch(/no S2S secret/)
    const withSecret = {
      ...form,
      networks: { ...form.networks, unity: { ...form.networks.unity, s2sSecret: 'abc' } },
    }
    expect(errorsOf(withSecret)['rewards.requireAdVerification']).toBeUndefined()
  })

  it('previews the share among enabled networks', () => {
    const form = settingsToForm(adSettingsFixture)
    expect(
      sharePreview({
        networks: {
          ...form.networks,
          admob: { ...form.networks.admob, weight: 70 },
          unity: { ...form.networks.unity, weight: 30 },
        },
      }),
    ).toEqual({ admob: 70, unity: 30 })
    expect(
      sharePreview({ networks: { ...form.networks, unity: { ...form.networks.unity, enabled: false } } }),
    ).toEqual({ admob: 100, unity: 0 })
  })

  it('flags likely broken callbacks from not-verified responses', () => {
    const totals = {
      claimsCreated: 100,
      claimsCompleted: 100,
      claimsExpired: 0,
      completionRate: 1,
      coinsCredited: 0,
      callbacksReceived: 0,
      callbacksRejected: 0,
      notVerifiedResponses: 5,
    }
    expect(verificationLooksBroken(totals)).toBe(false)
    expect(verificationLooksBroken({ ...totals, notVerifiedResponses: 40 })).toBe(true)
  })
})
