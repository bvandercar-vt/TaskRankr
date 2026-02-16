/**
 * @fileoverview Form component for creating and editing tasks
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { omit, pick } from 'es-toolkit'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/primitives/Button'
import { Calendar } from '@/components/primitives/forms/Calendar'
import { Checkbox } from '@/components/primitives/forms/Checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/forms/Form'
import { Textarea } from '@/components/primitives/forms/Textarea'
import { TimeInput } from '@/components/primitives/forms/TimeInput'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/primitives/overlays/Popover'
import { TagChain } from '@/components/primitives/TagChain'
import { RankFieldSelect } from '@/components/RankFieldSelect'
import { SubtaskBlockedTooltip } from '@/components/SubtaskBlockedTooltip'
import { SubtasksCard } from '@/components/SubtasksCard'
import { useSettings } from '@/hooks/useSettings'
import { useTaskParentChain, useTasks } from '@/hooks/useTasks'
import { getDirectSubtasks, RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import {
  insertTaskSchema,
  type MutateTask,
  type RankField,
  SubtaskSortMode,
  type Task,
  TaskStatus,
} from '~/shared/schema'
import type {
  DeleteTaskArgs,
  MutateTaskContent,
} from './providers/LocalStateProvider'

const STUB_TASK: Task = {
  id: 0,
  userId: '',
  name: '',
  description: null,
  priority: null,
  ease: null,
  enjoyment: null,
  time: null,
  parentId: null,
  status: TaskStatus.OPEN,
  inProgressTime: 0,
  inProgressStartedAt: null,
  createdAt: new Date(),
  completedAt: null,
  subtaskSortMode: SubtaskSortMode.INHERIT,
  subtaskOrder: [],
  subtasksShowNumbers: false,
  hidden: false,
  autoHideCompleted: false,
  inheritCompletionState: false,
}

interface DateCreatedInputProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
}

const DateCreatedInput = ({ value, onChange }: DateCreatedInputProps) => (
  <FormItem className="flex items-center justify-between gap-4">
    <div>
      <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Date Created
      </FormLabel>
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={'outline'}
            className={cn(
              'w-auto bg-secondary/10 border-white/5 h-8 text-xs py-1 px-3 font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            {value ? format(value, 'PPP') : <span>Pick a date</span>}
            <CalendarIcon className="size-3 ml-2 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-card border-white/10 z-[300]"
        align="end"
      >
        <div className="p-3 border-b border-white/5 bg-secondary/50 text-[10px] uppercase tracking-wider text-muted-foreground text-center">
          Select Creation Date
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  </FormItem>
)

export interface TaskFormProps {
  onSubmit: (data: MutateTaskContent) => void
  initialData?: Task
  parentId?: number | null
  onCancel: () => void
  onAddSubtask: (parentId: number, formData?: MutateTaskContent) => void
  onEditSubtask: (task: Task) => void
  onDeleteSubtask: (task: DeleteTaskArgs) => void
  onAssignSubtask: (task: Task, formData?: MutateTaskContent) => void
  onMarkCompleted?: (taskId: number) => void
}

export const TaskForm = ({
  onSubmit,
  initialData,
  parentId,
  onCancel,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onAssignSubtask,
  onMarkCompleted,
}: TaskFormProps) => {
  const parentChain = useTaskParentChain(parentId ?? undefined)
  const { data: allTasks } = useTasks()
  const { settings } = useSettings()
  const [markCompleted, setMarkCompleted] = useState(false)

  const hasIncompleteSubtasks = initialData
    ? getDirectSubtasks(allTasks, initialData.id).some(
        (t) => t.status !== TaskStatus.COMPLETED,
      )
    : false

  const rankFieldConfig = useMemo(
    () =>
      new Map(
        RANK_FIELDS_COLUMNS.map(({ name }) => {
          const { visible, required: rawRequired } = settings.fieldConfig[name]
          const required = visible && rawRequired
          return [name, { visible, required }]
        }),
      ),
    [settings],
  )

  const visibleRankFields = useMemo(
    () =>
      RANK_FIELDS_COLUMNS.filter(
        (attr) => rankFieldConfig.get(attr.name)?.visible,
      ),
    [rankFieldConfig],
  )

  const formSchema = useMemo(
    () =>
      insertTaskSchema
        .omit({ userId: true })
        .required(
          Object.fromEntries(
            RANK_FIELDS_COLUMNS.map(({ name }) => [
              name,
              Boolean(rankFieldConfig.get(name)?.required),
            ]).filter(([, isReq]) => isReq),
          ) satisfies Record<RankField, boolean>,
        ),
    [rankFieldConfig],
  )

  const getFormDefaults = useCallback(
    (data: Task | undefined): MutateTaskContent =>
      data
        ? {
            description: data.description ?? '',
            ...pick(data, [
              'name',
              'priority',
              'ease',
              'enjoyment',
              'time',
              'parentId',
              'inProgressTime',
            ]),
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
          }
        : {
            name: '',
            description: '',
            priority: null,
            ease: null,
            enjoyment: null,
            time: null,
            parentId: parentId ?? null,
            createdAt: new Date(),
            inProgressTime: 0,
          },
    [parentId],
  )

  const form = useForm<MutateTask>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: getFormDefaults(initialData),
  })
  const {
    formState: { isValid },
  } = form

  useEffect(() => {
    form.reset(getFormDefaults(initialData))
  }, [initialData, form, getFormDefaults])

  // biome-ignore lint/correctness/useExhaustiveDependencies: is necessary
  useEffect(() => {
    void form.trigger()
  }, [rankFieldConfig, form])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          onSubmit(omit(data, ['subtaskSortMode', 'subtaskOrder']))
          if (markCompleted && initialData && onMarkCompleted) {
            onMarkCompleted(initialData.id)
          }
        })}
        className="flex flex-col h-full"
      >
        <div className="pb-2  px-4 pt-2">
          <TagChain items={parentChain} label="Parent" className="px-1 mb-2" />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Task Name</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Task name"
                    className="bg-secondary/20 border-white/5 min-h-12 text-lg focus-visible:ring-primary/50 resize-none overflow-hidden"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div
          className="min-h-0 overflow-y-auto [scrollbar-gutter:stable_both-edges] py-2"
          data-testid="form-scroll-region"
        >
          <div className="flex-1 space-y-5 px-3">
            {visibleRankFields.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {visibleRankFields.map(({ name, label, levels }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <RankFieldSelect
                        name={name}
                        label={label}
                        levels={levels}
                        field={field}
                        isRequired={Boolean(
                          rankFieldConfig.get(name)?.required,
                        )}
                      />
                    )}
                  />
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      className="bg-secondary/20 border-white/5 min-h-[50px] max-h-[200px] resize-none focus-visible:ring-primary/50"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SubtasksCard
              {...(initialData
                ? {
                    task: initialData,
                    onAddSubtask,
                    onEditSubtask,
                    onDeleteSubtask,
                    onAssignSubtask,
                  }
                : {
                    task: STUB_TASK,
                    onAddSubtask: () =>
                      form.handleSubmit((data) => {
                        onAddSubtask(STUB_TASK.id, data)
                      })(),
                    onAssignSubtask: () =>
                      form.handleSubmit((data) => {
                        onAssignSubtask(STUB_TASK, data)
                      })(),
                  })}
            />

            <div className="flex flex-col gap-4 mt-2 pb-4">
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <DateCreatedInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {initialData?.status === TaskStatus.COMPLETED &&
                initialData?.completedAt && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Date Completed
                    </div>
                    <div className="text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                      {format(new Date(initialData.completedAt), 'PPP p')}
                    </div>
                  </div>
                )}

              {settings.enableInProgressTime && (
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Time Spent
                  </div>
                  <TimeInput
                    durationMs={form.watch('inProgressTime') || 0}
                    onDurationChange={(ms) =>
                      form.setValue('inProgressTime', ms)
                    }
                    className="w-16 h-8 text-xs bg-secondary/20 border-white/5 text-center"
                  />
                </div>
              )}

              {initialData &&
                initialData.status !== TaskStatus.COMPLETED &&
                onMarkCompleted && (
                  <SubtaskBlockedTooltip blocked={hasIncompleteSubtasks}>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is an input. */}
                    <label
                      className={cn(
                        'flex items-center justify-between gap-4',
                        hasIncompleteSubtasks
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer',
                      )}
                      data-testid="checkbox-mark-completed"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Completed
                      </div>
                      <Checkbox
                        checked={markCompleted}
                        disabled={hasIncompleteSubtasks}
                        onCheckedChange={(checked) =>
                          setMarkCompleted(checked === true)
                        }
                        className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                    </label>
                  </SubtaskBlockedTooltip>
                )}
            </div>
          </div>
        </div>

        <div className="pt-2 pb-4 px-4 flex gap-3 ">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 border-white/10 bg-background hover:bg-secondary/20 text-lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg disabled:bg-primary/80 disabled:cursor-not-allowed"
          >
            {initialData ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
