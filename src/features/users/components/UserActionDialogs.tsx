import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBanUser, useUnbanUser, useUpdateUserRole } from '../api/mutations'
import type { AdminUser } from '../types/user.types'

export type UserAction = { type: 'ban' | 'unban' | 'role'; user: AdminUser } | null

const REASON_MAX = 255

/** Ban / unban / role confirmations shared by the users list and the user detail page. */
export function UserActionDialogs({ action, onClose }: { action: UserAction; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const ban = useBanUser()
  const unban = useUnbanUser()
  const role = useUpdateUserRole()
  const user = action?.user
  const close = (open: boolean) => {
    if (!open) {
      setReason('')
      onClose()
    }
  }

  return (
    <>
      <ConfirmDialog
        open={action?.type === 'ban'}
        onOpenChange={close}
        title={`Ban ${user?.name ?? 'user'}?`}
        description={
          <>
            <p>This will end all active sessions for this user.</p>
            <p>They won't be able to sign in or earn rewards until they're unbanned.</p>
          </>
        }
        confirmLabel="Ban user"
        destructive
        pending={ban.isPending}
        onConfirm={() => user && ban.mutateAsync({ id: user.id, reason: reason.trim() || null })}
      >
        <div className="space-y-2">
          <Label htmlFor="ban-reason">Reason (optional)</Label>
          <Textarea
            id="ban-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={REASON_MAX}
            rows={3}
            placeholder="e.g. Fraudulent referrals"
          />
          <p className="text-xs text-muted-foreground">Recorded in the audit log.</p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={action?.type === 'unban'}
        onOpenChange={close}
        title={`Unban ${user?.name ?? 'user'}?`}
        description="They will be able to sign in and earn rewards again."
        confirmLabel="Unban user"
        pending={unban.isPending}
        onConfirm={() => user && unban.mutateAsync(user.id)}
      />

      <ConfirmDialog
        open={action?.type === 'role'}
        onOpenChange={close}
        title={
          user?.role === 'ADMIN'
            ? `Remove admin role from ${user.name}?`
            : `Make ${user?.name ?? 'user'} an admin?`
        }
        description={
          user?.role === 'ADMIN'
            ? 'They will lose access to this admin panel immediately.'
            : 'Admins can manage users, content, payouts and business configuration. Only grant this to trusted staff.'
        }
        confirmLabel={user?.role === 'ADMIN' ? 'Remove admin role' : 'Make admin'}
        destructive={user?.role === 'ADMIN'}
        pending={role.isPending}
        onConfirm={() =>
          user && role.mutateAsync({ id: user.id, role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })
        }
      />
    </>
  )
}
