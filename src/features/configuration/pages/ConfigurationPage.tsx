import type { ComponentType } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfigEntries } from '../api/hooks'
import { UnrecognizedConfig } from '../components/ConfigCard'
import {
  LeaderboardSection,
  ReferralSection,
  SignupSection,
  SupportSection,
  WalletSection,
} from '../components/EconomySections'
import {
  ArticlesSection,
  CaptchaSection,
  CheckInSection,
  QuizSection,
  ScratchCardSection,
} from '../components/RewardSections'
import { SpinWheelSection } from '../components/SpinWheelSection'
import { CONFIG_KEYS, type ConfigEntry, type ConfigKey } from '../types/config.types'
import { ShieldAlert } from 'lucide-react'

type Section = { key: ConfigKey; title: string; Component: ComponentType<{ entry: ConfigEntry }> }

const GROUPS: { value: string; label: string; sections: Section[] }[] = [
  {
    value: 'rewards',
    label: 'Rewards',
    sections: [
      { key: 'check_in', title: 'Daily check-in', Component: CheckInSection },
      { key: 'spin_wheel', title: 'Spin wheel', Component: SpinWheelSection },
      { key: 'scratch_card', title: 'Scratch card', Component: ScratchCardSection },
      { key: 'captcha', title: 'Captcha', Component: CaptchaSection },
      { key: 'quiz', title: 'Quizzes', Component: QuizSection },
      { key: 'articles', title: 'Read & Earn', Component: ArticlesSection },
    ],
  },
  {
    value: 'economy',
    label: 'Wallet & growth',
    sections: [
      { key: 'wallet', title: 'Wallet', Component: WalletSection },
      { key: 'referral', title: 'Referrals', Component: ReferralSection },
      { key: 'signup', title: 'Sign-up', Component: SignupSection },
      { key: 'leaderboard', title: 'Leaderboard', Component: LeaderboardSection },
    ],
  },
  {
    value: 'support',
    label: 'Support',
    sections: [{ key: 'support', title: 'Support contact', Component: SupportSection }],
  },
]

export function ConfigurationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useConfigEntries()
  const requested = searchParams.get('tab')
  const tab =
    requested && (requested === 'other' || GROUPS.some((group) => group.value === requested))
      ? requested
      : 'rewards'

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Configuration" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const byKey = new Map(query.data.map((entry) => [entry.key, entry]))
  const unknown = query.data.filter((entry) => !(CONFIG_KEYS as readonly string[]).includes(entry.key))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Configuration"
        description="The rewards economy and app settings. Each section saves on its own and takes effect immediately."
      />

      <Alert>
        <ShieldAlert />
        <AlertDescription>
          These values control how many coins users earn and redeem. The server validates every change and
          rejects invalid values; every save is recorded in the audit log.
        </AlertDescription>
      </Alert>

      <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}>
        <TabsList className="h-auto flex-wrap">
          {GROUPS.map((group) => (
            <TabsTrigger key={group.value} value={group.value}>
              {group.label}
            </TabsTrigger>
          ))}
          {unknown.length > 0 && <TabsTrigger value="other">Other</TabsTrigger>}
        </TabsList>

        {GROUPS.map((group) => (
          <TabsContent key={group.value} value={group.value} className="pt-4">
            <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
              <nav aria-label={`${group.label} sections`} className="hidden xl:block">
                <ul className="sticky top-20 space-y-1 text-sm">
                  {group.sections.map((section) => (
                    <li key={section.key}>
                      <a
                        href={`#config-${section.key}`}
                        className="block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="min-w-0 space-y-6">
                {group.sections.map(({ key, title, Component }) => {
                  const entry = byKey.get(key)
                  if (!entry) {
                    return (
                      <p
                        key={key}
                        className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
                      >
                        {title} (<code>{key}</code>) isn't configured on the server.
                      </p>
                    )
                  }
                  // Remount after a save so the form picks up the stored value.
                  return <Component key={`${key}-${entry.updatedAt}`} entry={entry} />
                })}
              </div>
            </div>
          </TabsContent>
        ))}

        {unknown.length > 0 && (
          <TabsContent value="other" className="space-y-6 pt-4">
            {unknown.map((entry) => (
              <UnrecognizedConfig key={entry.key} entry={entry} />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
