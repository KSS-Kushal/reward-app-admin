import { AlertTriangle, History, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DateDisplay } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { isVersionConflict, useAdSettings, useSaveAdSettings } from '../api/hooks'
import { AdSettingsForm } from '../components/AdSettingsForm'
import { formToSaveRequest } from '../schemas/ad-settings.schema'

export function AdSettingsPage() {
  const query = useAdSettings()
  const save = useSaveAdSettings()
  const [conflict, setConflict] = useState(false)

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ad Settings" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const settings = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Settings"
        description={
          <>
            Version {settings.version}
            {settings.updatedAt && (
              <>
                {' '}
                · saved <DateDisplay value={settings.updatedAt} mode="relative" />
                {settings.updatedBy && ` by ${settings.updatedBy.name}`}
              </>
            )}
          </>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/ads/history">
              <History /> History
            </Link>
          </Button>
        }
      />

      <Alert>
        <Smartphone />
        <AlertDescription>Changes reach users the next time they open the app.</AlertDescription>
      </Alert>

      {settings.warnings && settings.warnings.length > 0 && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="text-warning" />
          <AlertTitle>Check these before relying on ads</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {settings.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <AdSettingsForm
        // Remount on every new version so the form shows exactly what is saved.
        key={settings.version}
        settings={settings}
        pending={save.isPending}
        onSubmit={async (values) => {
          try {
            await save.mutateAsync(formToSaveRequest(values, settings.version))
          } catch (error) {
            if (isVersionConflict(error)) setConflict(true)
            throw error
          }
        }}
      />

      <ConfirmDialog
        open={conflict}
        onOpenChange={setConflict}
        title="Someone else changed the settings"
        description="Another admin saved a newer version while you were editing. Reload to see their changes; your unsaved edits will be lost."
        confirmLabel="Reload settings"
        onConfirm={() => query.refetch()}
      />
    </div>
  )
}
