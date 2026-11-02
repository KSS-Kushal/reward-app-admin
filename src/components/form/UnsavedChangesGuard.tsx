import { useEffect } from 'react'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

/** Warns before leaving an editor with unsaved changes (in-app navigation and tab close). */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => !open && blocker.state === 'blocked' && blocker.reset()}
      title="Discard unsaved changes?"
      description="You have changes that haven't been saved. If you leave now, they will be lost."
      confirmLabel="Discard changes"
      destructive
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
    />
  )
}
