import {
  Ban,
  Clock,
  Coins,
  HandCoins,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { CopyButton } from '@/components/common/CopyButton'
import { DateDisplay, DetailList, Mono } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/context/auth-context'
import { formatNumber } from '@/lib/format'
import { useUser } from '../api/queries'
import { UserActionDialogs, type UserAction } from '../components/UserActionDialogs'
import { UserAvatar } from '../components/UserAvatar'

function WalletStat({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: number
  icon: ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
      <p className="text-xs text-muted-foreground">{hint ?? 'coins'}</p>
    </div>
  )
}

/** Disabled buttons don't fire pointer events; the wrapper keeps the tooltip working. */
function SelfGuard({ self, children }: { self: boolean; children: ReactNode }) {
  if (!self) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>You can't change your own status or role.</TooltipContent>
    </Tooltip>
  )
}

export function UserDetailsPage() {
  const { id } = useParams()
  const { admin } = useAuth()
  const query = useUser(id)
  const [action, setAction] = useState<UserAction>(null)
  useBreadcrumbLabel(query.data?.user.name)

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="User details" backTo="/admin/users" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const { user, balance, totalEarned, pendingCoins, totalRedeemed } = query.data
  const self = user.id === admin?.id

  return (
    <div className="space-y-6">
      <PageHeader
        title="User details"
        backTo="/admin/users"
        actions={
          <>
            <SelfGuard self={self}>
              <Button variant="outline" disabled={self} onClick={() => setAction({ type: 'role', user })}>
                {user.role === 'ADMIN' ? <ShieldOff /> : <ShieldCheck />}
                {user.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
              </Button>
            </SelfGuard>
            {user.status === 'BANNED' ? (
              <Button variant="outline" onClick={() => setAction({ type: 'unban', user })}>
                <UserCheck /> Unban
              </Button>
            ) : (
              <SelfGuard self={self}>
                <Button
                  variant="destructive"
                  disabled={self}
                  onClick={() => setAction({ type: 'ban', user })}
                >
                  <Ban /> Ban user
                </Button>
              </SelfGuard>
            )}
          </>
        }
      />

      {user.status === 'BANNED' && (
        <Alert variant="destructive">
          <Ban />
          <AlertDescription>This account is banned. The user can't sign in or earn rewards.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} className="size-16 text-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="truncate text-xl font-semibold">
              {user.name}
              {self && <span className="ml-2 text-sm font-normal text-muted-foreground">(you)</span>}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={user.status} />
              <StatusBadge status={user.role} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" /> Wallet
            </CardTitle>
            <CardDescription>Balances from the coin ledger.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <WalletStat
              label="Balance"
              value={balance}
              icon={<Coins className="size-4" />}
              hint="coins available"
            />
            <WalletStat label="Total earned" value={totalEarned} icon={<TrendingUp className="size-4" />} />
            <WalletStat
              label="Pending"
              value={pendingCoins}
              icon={<Clock className="size-4" />}
              hint="coins awaiting confirmation"
            />
            <WalletStat label="Redeemed" value={totalRedeemed} icon={<HandCoins className="size-4" />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: 'Joined', value: <DateDisplay value={user.joinedAt} /> },
                { label: 'Last login', value: <DateDisplay value={user.lastLoginAt} /> },
                {
                  label: 'Referral code',
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <Mono>{user.referralCode}</Mono>
                      <CopyButton value={user.referralCode} label="Copy referral code" />
                    </span>
                  ),
                },
                { label: 'Phone', value: user.phone ?? '—' },
                {
                  label: 'User ID',
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <Mono className="max-w-36 truncate">{user.id}</Mono>
                      <CopyButton value={user.id} label="Copy user ID" />
                    </span>
                  ),
                },
              ]}
            />
            <div className="mt-2 flex flex-col items-start">
              <Button variant="link" className="h-auto px-0 py-1" asChild>
                <Link to={`/admin/ads/reward-claims?userId=${user.id}`}>Reward claims</Link>
              </Button>
              <Button variant="link" className="h-auto px-0 py-1" asChild>
                <Link to={`/admin/audit-log?entityType=user`}>View user changes in the audit log</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserActionDialogs action={action} onClose={() => setAction(null)} />
    </div>
  )
}
