/**
 * @fileoverview User preferences and settings configuration page.
 */

import { useRef, useState } from 'react'
import { ChevronRight, Download, LogOut, Trash2, Upload } from 'lucide-react'
import { Link } from 'wouter'

import { BackButton } from '@/components/BackButton'
import { ContactCard } from '@/components/ContactCard'
import { Button } from '@/components/primitives/Button'
import { CollapsibleCard } from '@/components/primitives/CollapsibleCard'
import { Checkbox } from '@/components/primitives/forms/Checkbox'
import { Switch } from '@/components/primitives/forms/Switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/primitives/overlays/AlertDialog'
import { useGuestMode } from '@/components/providers/GuestModeProvider'
import { SortInfo } from '@/components/SortInfo'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { useToast } from '@/hooks/useToast'
import { IconSizeStyle, Routes } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { QueryKeys, tsr } from '@/lib/ts-rest'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'
import { contract } from '~/shared/contract'
import { type FieldConfig, TaskStatus } from '~/shared/schema'

const Card = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={cn('p-4 bg-card rounded-lg border border-white/10', className)}
  >
    {children}
  </div>
)

interface SwitchSettingProps {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  'data-testid': string
}

const SwitchSetting = ({
  title,
  description,
  checked,
  onCheckedChange,
  'data-testid': testId,
}: SwitchSettingProps) => (
  <>
    <div className="flex-1 mr-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      data-testid={testId}
    />
  </>
)

const SwitchCard = (props: SwitchSettingProps) => (
  <Card className="flex items-center justify-between">
    <SwitchSetting {...props} />
  </Card>
)

const AttributeSettingsCard = ({
  fieldConfig,
  updateFieldFlags,
}: {
  fieldConfig: FieldConfig
  updateFieldFlags: ReturnType<typeof useSettings>['updateFieldFlags']
}) => (
  <Card className="mt-4">
    <h3 className="font-semibold text-foreground mb-4">Attribute Settings</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Control which attributes appear in forms and task cards.
    </p>
    <table className="w-full" data-testid="table-attribute-settings">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left py-2 font-medium text-sm text-muted-foreground">
            Attribute
          </th>
          <th className="text-center py-2 font-medium text-sm text-muted-foreground">
            Visible
          </th>
          <th className="text-center py-2 font-medium text-sm text-muted-foreground">
            Required
          </th>
        </tr>
      </thead>
      <tbody>
        {RANK_FIELDS_COLUMNS.map(({ name, label }) => {
          const { visible, required } = fieldConfig[name]

          return (
            <tr key={name} className="border-b border-white/5">
              <td className="py-3 text-foreground">{label}</td>
              <td className="py-3 text-center">
                <Checkbox
                  checked={visible}
                  onCheckedChange={(checked) => {
                    const newVisible = !!checked
                    updateFieldFlags(name, {
                      visible: newVisible,
                      ...(!newVisible && required ? { required: false } : {}),
                    })
                  }}
                  data-testid={`checkbox-${name}-visible`}
                />
              </td>
              <td className="py-3 text-center">
                <Checkbox
                  checked={required}
                  onCheckedChange={(checked) =>
                    updateFieldFlags(name, { required: !!checked })
                  }
                  disabled={!visible}
                  className={!visible ? 'opacity-50' : ''}
                  data-testid={`checkbox-${name}-required`}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </Card>
)

const ExportButton = () => {
  const { data: tasks } = useTasks()
  const hasNoTasks = tasks.length === 0

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => {
        window.location.href = contract.tasks.export.path
      }}
      disabled={hasNoTasks}
      data-testid="button-export"
    >
      <Download className={IconSizeStyle.HW4} />
      Export Tasks
    </Button>
  )
}

const ImportButton = () => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const result = await tsr.tasks.import.mutate({
        body: { tasks: data.tasks || data },
      })
      if (result.status !== 200) {
        throw new Error('Import failed')
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.getTasks })
      toast({ title: 'Tasks imported successfully' })
    } catch (_error) {
      toast({ title: 'Failed to import tasks', variant: 'destructive' })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        data-testid="button-import"
      >
        <Upload className={IconSizeStyle.HW4} />
        {isImporting ? 'Importing...' : 'Import Tasks'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-import-file"
      />
    </>
  )
}

const Settings = () => {
  const { settings, updateSettings, updateFieldFlags } = useSettings()
  const { user } = useAuth()
  const { isGuestMode } = useGuestMode()
  const { toast } = useToast()
  const { data: allTasks } = useTasks()
  const { setTaskStatus } = useTaskActions()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BackButton />
          <h1 className="text-2xl font-bold" data-testid="heading-settings">
            Settings
          </h1>
        </div>

        <div className="space-y-4">
          <SwitchCard
            title="Automatically Pin new tasks"
            description="When enabled, new tasks will be pinned to the top of your list automatically."
            checked={settings.autoPinNewTasks}
            onCheckedChange={(checked) =>
              updateSettings({ autoPinNewTasks: checked })
            }
            data-testid="switch-auto-pin"
          />
          <SwitchCard
            title="Always sort pinned by Priority"
            description={
              settings.alwaysSortPinnedByPriority
                ? 'Pinned tasks are always sorted by priority first, then by your selected sort.'
                : 'Pinned tasks are sorted using your selected sort only.'
            }
            checked={settings.alwaysSortPinnedByPriority}
            onCheckedChange={(checked) =>
              updateSettings({ alwaysSortPinnedByPriority: checked })
            }
            data-testid="switch-sort-pinned-priority"
          />
          <Card>
            <div className="flex items-center justify-between">
              <SwitchSetting
                title='Enable "In Progress" Status'
                description={
                  'Allow tasks to be marked as "In Progress" to pin to the top and track active work.'
                }
                checked={settings.enableInProgressStatus}
                onCheckedChange={(checked) => {
                  updateSettings({ enableInProgressStatus: checked })
                  if (!checked) {
                    updateSettings({ enableInProgressTime: false })
                    // Demote any in_progress task to pinned
                    const inProgressTask = allTasks.find(
                      (t) => t.status === TaskStatus.IN_PROGRESS,
                    )
                    if (inProgressTask) {
                      setTaskStatus(inProgressTask.id, TaskStatus.PINNED)
                    }
                  }
                }}
                data-testid="switch-enable-in-progress"
              />
            </div>
            {settings.enableInProgressStatus && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <SwitchSetting
                  title='Enable "In Progress" Time'
                  description="Track and display time spent In Progress."
                  checked={settings.enableInProgressTime}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableInProgressTime: checked })
                  }
                  data-testid="switch-enable-time"
                />
              </div>
            )}
          </Card>
        </div>

        <AttributeSettingsCard
          fieldConfig={settings.fieldConfig}
          updateFieldFlags={updateFieldFlags}
        />

        <div className="mt-8">
          <SortInfo />
        </div>

        <Link href={Routes.HOW_TO_USE}>
          <Card className="mt-4 flex items-center justify-between gap-2 hover-elevate cursor-pointer">
            <div>
              <h3 className="font-semibold text-foreground">
                How To Use
              </h3>
              <p className="text-sm text-muted-foreground">
                Learn how to get the most out of TaskRankr
              </p>
            </div>
            <ChevronRight className={cn(IconSizeStyle.HW5, 'text-muted-foreground shrink-0')} />
          </Card>
        </Link>

        {!isGuestMode && (
          <Card className="mt-8 flex items-center justify-between">
            <div>
              <p
                className="font-semibold text-foreground"
                data-testid="text-user-name"
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-user-email"
              >
                {user?.email}
              </p>
            </div>
            <a href={authPaths.logout}>
              <Button
                variant="outline"
                className="gap-2"
                data-testid="button-logout"
              >
                <LogOut className={IconSizeStyle.HW4} />
                Log Out
              </Button>
            </a>
          </Card>
        )}

        <ContactCard className="mt-4" />

        <CollapsibleCard
          title="Import/Export Data"
          className="mt-8 bg-card/50"
          data-testid="collapsible-import-export"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <ExportButton />
            <ImportButton />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Export your tasks as JSON or import from a previously exported file.
          </p>
        </CollapsibleCard>

        <CollapsibleCard
          title="Clear Local Data"
          className="mt-3 bg-card/50"
          data-testid="collapsible-clear-local-data"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Remove all locally cached data. Your synced data on the server won't
            be affected.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 text-red-400/70 border-red-400/30"
                data-testid="button-clear-local-storage"
              >
                <Trash2 className={IconSizeStyle.HW4} />
                Clear Local Storage
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Local Storage?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all locally cached data and reload the app.
                  Your synced data on the server won't be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-clear">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    localStorage.clear()
                    toast({ title: 'Local storage cleared' })
                    window.location.reload()
                  }}
                  data-testid="button-confirm-clear"
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CollapsibleCard>

        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-sm font-medium" data-testid="text-app-name">
            TaskRankr
          </p>
          <p className="text-xs mt-1" data-testid="text-app-description">
            Track tasks with priority, ease, enjoyment, and time ratings.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Settings
