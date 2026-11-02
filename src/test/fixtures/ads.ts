import type { AdminAdSettings } from '@/features/ads/types/ads.types'

export const adSettingsFixture: AdminAdSettings = {
  enabled: true,
  version: 7,
  networks: {
    admob: {
      enabled: true,
      weight: 50,
      rewardedId: 'ca-app-pub-1234567890123456/1111111111',
      interstitialId: 'ca-app-pub-1234567890123456/2222222222',
      bannerId: '',
      nativeId: '',
    },
    unity: {
      enabled: true,
      weight: 50,
      gameId: '5712345',
      testMode: false,
      rewardedId: 'Rewarded_Android',
      interstitialId: 'Interstitial_Android',
      bannerId: 'Banner_Android',
      hasS2sSecret: true,
    },
  },
  interstitial: { everyScreens: 4, minIntervalSeconds: 90, warmupSeconds: 60 },
  rewardedLoadTimeoutSeconds: 10,
  placements: { captcha: { banner: true }, quiz: { banner: true, native: false } },
  rewards: { requireAdVerification: true },
  captcha: { cooldownSeconds: 10 },
  callbackUrls: {
    admob: 'https://api.example/ads/callbacks/admob',
    unity: 'https://api.example/ads/callbacks/unity',
  },
  lastAcceptedCallbackAt: { admob: '2026-10-24T09:00:00Z', unity: null },
  warnings: [],
  updatedAt: '2026-10-24T09:12:00Z',
  updatedBy: { id: 'a1', name: 'Ritik Sharma' },
}
