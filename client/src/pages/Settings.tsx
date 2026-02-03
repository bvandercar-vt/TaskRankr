import { useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronDown, Download, LogOut, Upload } from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/button'
import { Checkbox } from '@/components/primitives/forms/checkbox'
import { Switch } from '@/components/primitives/forms/switch'
import { useAuth } from '@/hooks/use-auth'
import { useSettings } from '@/hooks/use-settings'
import { useTasks } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/query-client'
import { getAttributeStyle } from '@/lib/task-styles'
import { QueryKeys, tsr } from '@/lib/ts-rest'
import {
  cn,
  getIsRequired,
  getIsRequiredKey,
  getIsVisible,
  getIsVisibleKey,
} from '@/lib/utils'
import { contract } from '~/shared/contract'
import { authPaths } from '~/shared/routes'
import {
  RANK_FIELDS_CRITERIA,
  type SortFieldValueMap,
  type SortOption,
} from '~/shared/schema'

const SettingsCard = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={cn('p-4 bg-card rounded-lg border border-white/10', className)}
  >
    {children}
  </div>
)

const SettingsSwitchRow = ({
  title,
  description,
  checked,
  onCheckedChange,
  testId,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  testId: string
}) => (
  <SettingsCard className="flex items-center justify-between">
    <div className="flex-1">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      data-testid={testId}
    />
  </SettingsCard>
)

type SortCriterion = {
  attr: SortOption
  value: string
}

type SortInfoItem = {
  name: string
  fullWidth?: boolean
  criteria: SortCriterion[]
}

const SORT_INFO_CONFIG: SortInfoItem[] = [
  {
    name: 'Date',
    fullWidth: true,
    criteria: [{ attr: 'date', value: 'newest' }],
  },
  {
    name: 'Priority',
    criteria: [
      { attr: 'priority', value: 'highest' },
      { attr: 'ease', value: 'easiest' },
      { attr: 'enjoyment', value: 'highest' },
    ],
  },
  {
    name: 'Ease',
    criteria: [
      { attr: 'ease', value: 'easiest' },
      { attr: 'priority', value: 'highest' },
      { attr: 'enjoyment', value: 'highest' },
    ],
  },
  {
    name: 'Enjoyment',
    criteria: [
      { attr: 'enjoyment', value: 'highest' },
      { attr: 'priority', value: 'highest' },
      { attr: 'ease', value: 'easiest' },
    ],
  },
  {
    name: 'Time',
    criteria: [
      { attr: 'time', value: 'lowest' },
      { attr: 'priority', value: 'highest' },
      { attr: 'ease', value: 'easiest' },
    ],
  },
]

const ATTR_LABELS: Record<string, string> = {
  priority: 'Priority',
  ease: 'Ease',
  enjoyment: 'Enjoyment',
  time: 'Time',
  date: 'Date created',
}

const Settings = () => {
  const { settings, updateSetting } = useSettings()
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: tasks } = useTasks()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [sortInfoExpanded, setSortInfoExpanded] = useState(false)
  const hasNoTasks = !tasks || tasks.length === 0

  const handleExport = () => {
    window.location.href = contract.tasks.export.path
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="heading-settings">
            Settings
          </h1>
        </div>

        <div className="space-y-4">
          <SettingsSwitchRow
            title="Automatically Pin new tasks"
            description="When enabled, new tasks will be pinned to the top of your list automatically."
            checked={settings.autoPinNewTasks}
            onCheckedChange={(checked) => updateSetting('autoPinNewTasks', checked)}
            testId="switch-auto-pin"
          />
          <SettingsSwitchRow
            title="Enable In Progress Time"
            description="Track and display time spent working on tasks."
            checked={settings.enableInProgressTime}
            onCheckedChange={(checked) => updateSetting('enableInProgressTime', checked)}
            testId="switch-enable-time"
          />
          <SettingsSwitchRow
            title="Always sort pinned by Priority"
            description="Pinned tasks are always sorted by priority first, then by your selected sort."
            checked={settings.alwaysSortPinnedByPriority}
            onCheckedChange={(checked) => updateSetting('alwaysSortPinnedByPriority', checked)}
            testId="switch-sort-pinned-priority"
          />
        </div>

        <SettingsCard className="mt-8">
          <h3 className="font-semibold text-foreground mb-4">
            Attribute Settings
          </h3>
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
              {RANK_FIELDS_CRITERIA.map(({ name, label }) => {
                const visibleKey = getIsVisibleKey(name)
                const requiredKey = getIsRequiredKey(name)
                const isVisible = getIsVisible(name, settings)
                const isRequired = getIsRequired(name, settings)

                return (
                  <tr key={name} className="border-b border-white/5">
                    <td className="py-3 text-foreground">{label}</td>
                    <td className="py-3 text-center">
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(
                          checked: boolean | 'indeterminate',
                        ) => {
                          const newVisible = !!checked
                          updateSetting(visibleKey, newVisible)
                          if (!newVisible && isRequired) {
                            updateSetting(requiredKey, false)
                          }
                        }}
                        data-testid={`checkbox-${name}-visible`}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Checkbox
                        checked={isRequired}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          updateSetting(requiredKey, !!checked)
                        }
                        disabled={!isVisible}
                        className={!isVisible ? 'opacity-50' : ''}
                        data-testid={`checkbox-${name}-required`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </SettingsCard>

        <SettingsCard className="mt-8">
          <button
            onClick={() => setSortInfoExpanded(!sortInfoExpanded)}
            className="w-full flex items-center justify-start gap-2 cursor-pointer"
            data-testid="button-sort-info-toggle"
            type="button"
          >
            <h3 className="font-semibold text-foreground">Sort Info</h3>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                sortInfoExpanded && 'rotate-180',
              )}
            />
          </button>
          {sortInfoExpanded && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-3 text-center">
                When tasks have the same value, they are sorted by secondary
                attributes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {SORT_INFO_CONFIG.map((item) => (
                  <div
                    key={item.name}
                    className={cn(
                      'p-3 bg-secondary/20 rounded-md',
                      item.fullWidth && 'sm:col-span-2',
                    )}
                  >
                    <p className="font-medium text-foreground mb-1">
                      {item.name}
                    </p>
                    <ol
                      className={cn(
                        'text-xs list-decimal list-inside',
                        item.criteria.length > 1 && 'space-y-0.5',
                      )}
                    >
                      {item.criteria.map((c) => {
                        const style =
                          c.attr !== 'date'
                            ? getAttributeStyle(
                                c.attr,
                                c.value satisfies string as SortFieldValueMap[typeof c.attr],
                                '',
                              )
                            : ''
                        return (
                          <li
                            key={`${c.attr} ${c.value}`}
                            className="text-muted-foreground"
                          >
                            {ATTR_LABELS[c.attr]} (
                            {style ? (
                              <span className={cn('font-medium', style)}>
                                {c.value}
                              </span>
                            ) : (
                              c.value
                            )}{' '}
                            first)
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingsCard>

        <SettingsCard className="mt-8">
          <h3 className="font-semibold text-foreground mb-3 text-center">
            Data
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={hasNoTasks}
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export Tasks
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleImportClick}
              disabled={isImporting}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
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
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Export your tasks as JSON or import from a previously exported file.
          </p>
        </SettingsCard>

        <SettingsCard className="mt-4 flex items-center justify-between">
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
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </a>
        </SettingsCard>

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
