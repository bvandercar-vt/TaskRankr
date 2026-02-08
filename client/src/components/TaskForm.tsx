/**
 * @fileoverview Form component for creating and editing tasks
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { omit, pick } from 'es-toolkit'
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/primitives/Button'
import { Calendar } from '@/components/primitives/forms/Calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/forms/Form'
import { Input } from '@/components/primitives/forms/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/forms/Select'
import { Textarea } from '@/components/primitives/forms/Textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/primitives/overlays/Popover'
import { TagChain } from '@/components/primitives/TagChain'
import { getIsRequired, getIsVisible, useSettings } from '@/hooks/useSettings'
import {
  sortTasksByOrder,
  useReorderSubtasks,
  useSetTaskStatus,
  useTaskParentChain,
  useTasks,
  useUpdateTask,
} from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { getRankFieldStyle } from '@/lib/rank-field-styles'
import { cn } from '@/lib/utils'
import {
  insertTaskSchema,
  type MutateTask,
  RANK_FIELDS_CRITERIA,
  type RankField,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  type TaskWithSubtasks,
} from '~/shared/schema'
import type { MutateTaskContent } from './providers/LocalStateProvider'

interface SortableSubtaskItemProps {
  task: Task & { depth: number }
  onEdit?: (task: Task) => void
  onDelete: (task: { id: number; name: string }) => void
  onToggleComplete: (task: Task) => void
  isManualMode: boolean
  isDragDisabled?: boolean
}

const SortableSubtaskItem = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isManualMode,
  isDragDisabled,
}: SortableSubtaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${12 + task.depth * 16}px`,
  }

  const isDirect = task.depth === 0
  const showDragHandle = isManualMode && isDirect
  const isCompleted = task.status === TaskStatus.COMPLETED

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/5 select-none',
        isDragging && 'opacity-50 bg-secondary/20',
      )}
      data-testid={`subtask-row-${task.id}`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {showDragHandle && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-muted-foreground"
            {...attributes}
            {...listeners}
            data-testid={`drag-handle-${task.id}`}
          >
            <GripVertical className={IconSizeStyle.HW4} />
          </button>
        )}
        {task.depth > 0 && (
          <span className="text-muted-foreground/50 text-xs leading-none">
            └
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={cn(
            'shrink-0 h-4 w-4 rounded-sm border transition-colors',
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-muted-foreground/40 hover:border-muted-foreground',
          )}
          data-testid={`checkbox-complete-subtask-${task.id}`}
        >
          {isCompleted && <Check className="h-3 w-3 mx-auto" />}
        </button>
        <span
          className={cn(
            'text-sm truncate',
            isCompleted && 'line-through text-muted-foreground',
          )}
        >
          {task.name}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            data-testid={`button-edit-subtask-${task.id}`}
          >
            <Pencil className={IconSizeStyle.HW4} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete({ id: task.id, name: task.name })}
          data-testid={`button-delete-subtask-${task.id}`}
        >
          <Trash2 className={cn(IconSizeStyle.HW4, 'text-destructive')} />
        </Button>
      </div>
    </div>
  )
}

export interface TaskFormProps {
  onSubmit: (data: MutateTaskContent) => void
  isPending: boolean
  initialData?: Task
  parentId?: number | null
  onCancel: () => void
  onAddChild?: (parentId: number) => void
  onEditChild?: (task: Task) => void
  onSubtaskDelete?: (task: { id: number; name: string }) => void
}

export const TaskForm = ({
  onSubmit,
  isPending,
  initialData,
  parentId,
  onCancel,
  onAddChild,
  onEditChild,
  onSubtaskDelete,
}: TaskFormProps) => {
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)
  const [localSubtaskOrder, setLocalSubtaskOrder] = useState<number[] | null>(
    null,
  )
  const parentChain = useTaskParentChain(parentId ?? undefined)
  const { settings } = useSettings()
  const { data: allTasks } = useTasks()
  const updateTask = useUpdateTask()
  const setTaskStatus = useSetTaskStatus()
  const reorderSubtasks = useReorderSubtasks()

  const [sortMode, setSortMode] = useState<SubtaskSortMode>(
    initialData?.subtaskSortMode || SubtaskSortMode.INHERIT,
  )

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const subtasks = useMemo(() => {
    if (!initialData || !allTasks) return []
    const flattenTasks = (tasks: TaskWithSubtasks[]): TaskWithSubtasks[] => {
      const result: TaskWithSubtasks[] = []
      for (const t of tasks) {
        result.push(t)
        if (t.subtasks.length > 0) {
          result.push(...flattenTasks(t.subtasks))
        }
      }
      return result
    }
    const flatList = flattenTasks(allTasks)

    const collectDescendants = (
      parentId_: number,
      depth: number,
      parentSortMode: SubtaskSortMode,
    ): (TaskWithSubtasks & { depth: number })[] => {
      let children = flatList.filter((t) => t.parentId === parentId_)

      if (parentSortMode === SubtaskSortMode.MANUAL) {
        if (depth === 0 && localSubtaskOrder) {
          children = [...children].sort(
            (a, b) =>
              localSubtaskOrder.indexOf(a.id) - localSubtaskOrder.indexOf(b.id),
          )
        } else {
          const parentTask = flatList.find((t) => t.id === parentId_)
          const order = parentTask?.subtaskOrder ?? []
          children = sortTasksByOrder(children, order)
        }
      }

      const result: Array<TaskWithSubtasks & { depth: number }> = []
      for (const child of children) {
        result.push({ ...child, depth })
        result.push(
          ...collectDescendants(child.id, depth + 1, child.subtaskSortMode),
        )
      }
      return result
    }

    return collectDescendants(initialData.id, 0, sortMode)
  }, [initialData, allTasks, sortMode, localSubtaskOrder])

  const directChildIds = useMemo(
    () => subtasks.filter((t) => t.depth === 0).map((t) => t.id),
    [subtasks],
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && initialData) {
      const oldIndex = directChildIds.indexOf(active.id as number)
      const newIndex = directChildIds.indexOf(over.id as number)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(directChildIds, oldIndex, newIndex)
        setLocalSubtaskOrder(newOrder)
        reorderSubtasks.mutate({
          parentId: initialData.id,
          orderedIds: newOrder,
        })
      }
    }
  }

  const handleSortModeToggle = () => {
    if (!initialData || updateTask.isPending || reorderSubtasks.isPending)
      return
    const newMode: SubtaskSortMode =
      sortMode === SubtaskSortMode.INHERIT
        ? SubtaskSortMode.MANUAL
        : SubtaskSortMode.INHERIT

    setSortMode(newMode)

    if (newMode === SubtaskSortMode.MANUAL && directChildIds.length > 0) {
      reorderSubtasks.mutate({
        parentId: initialData.id,
        orderedIds: directChildIds,
      })
    }

    setLocalSubtaskOrder(null)
    updateTask.mutate({
      id: initialData.id,
      subtaskSortMode: newMode,
    })
  }

  const isMutating = updateTask.isPending || reorderSubtasks.isPending

  const getVisibility = useCallback(
    (attr: RankField) => getIsVisible(attr, settings),
    [settings],
  )

  const getRequired = useCallback(
    (attr: RankField) =>
      getIsVisible(attr, settings) && getIsRequired(attr, settings),
    [settings],
  )

  const visibleRankFields = useMemo(
    () => RANK_FIELDS_CRITERIA.filter((attr) => getVisibility(attr.name)),
    [getVisibility],
  )

  const formSchema = useMemo(() => {
    const base = insertTaskSchema.omit({ userId: true })
    const required = Object.fromEntries(
      RANK_FIELDS_CRITERIA.filter(({ name }) => getRequired(name)).map(
        ({ name }) => [name, z.string().min(1)],
      ),
    )
    return Object.keys(required).length ? base.extend(required) : base
  }, [getRequired])

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

  useEffect(() => {
    form.reset(getFormDefaults(initialData))
  }, [initialData, form, getFormDefaults])

  useEffect(() => {
    form.trigger()
  }, [formSchema, form])

  const isValid = form.formState.isValid

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit(omit(data, ['subtaskSortMode', 'subtaskOrder'])),
        )}
        className="flex flex-col h-full space-y-6"
      >
        <div className="flex-1 space-y-6">
          <TagChain items={parentChain} label="Parent" className="px-1 mb-2" />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Task Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Task name"
                    className="bg-secondary/20 border-white/5 h-12 text-lg focus-visible:ring-primary/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {visibleRankFields.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {visibleRankFields.map((attr) => {
                const isRequired = getRequired(attr.name)
                const showNoneOption = !isRequired

                return (
                  <FormField
                    key={attr.name}
                    control={form.control}
                    name={attr.name}
                    render={({ field }) => {
                      const hasError = isRequired && !field.value
                      return (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {attr.label}
                            {isRequired && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </FormLabel>
                          <Select
                            onValueChange={(v) =>
                              field.onChange(v === 'none' ? null : v)
                            }
                            value={field.value ?? 'none'}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  'bg-secondary/20 capitalize font-semibold h-10',
                                  hasError
                                    ? 'border-destructive/50'
                                    : 'border-white/5',
                                  getRankFieldStyle(
                                    attr.name,
                                    field.value,
                                    'text-muted-foreground',
                                  ),
                                )}
                              >
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-white/10 z-[200]">
                              {showNoneOption && (
                                <SelectItem
                                  value="none"
                                  className="text-muted-foreground italic"
                                >
                                  None
                                </SelectItem>
                              )}
                              {attr.levels.filter(Boolean).map((level) => (
                                <SelectItem
                                  key={level}
                                  value={level}
                                  className={cn(
                                    'capitalize font-semibold',
                                    getRankFieldStyle(attr.name, level),
                                  )}
                                >
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {hasError && (
                            <p className="text-[10px] text-destructive mt-1">
                              Required
                            </p>
                          )}
                        </FormItem>
                      )
                    }}
                  />
                )
              })}
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
                    className="bg-secondary/20 border-white/5 min-h-[50px] resize-none focus-visible:ring-primary/50"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {initialData && onAddChild && (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              {subtasks.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                    className="w-full flex items-center justify-between gap-2 p-3 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                    data-testid="button-toggle-subtasks"
                  >
                    <span className="text-sm font-medium">
                      Subtasks ({subtasks.length})
                    </span>
                    <ChevronDown
                      className={cn(
                        IconSizeStyle.HW4,
                        'text-muted-foreground transition-transform',
                        subtasksExpanded && 'rotate-180',
                      )}
                    />
                  </button>
                  {subtasksExpanded && (
                    <>
                      <div className="flex flex-col gap-1.5 px-3 py-2.5 border-b border-white/5 bg-secondary/5">
                        <span
                          className="text-xs font-medium text-muted-foreground"
                          data-testid="label-sorting-method"
                        >
                          Sorting Method
                        </span>
                        <div
                          className={cn(
                            'inline-flex rounded-md border border-white/10 overflow-hidden self-start',
                            isMutating && 'opacity-50 pointer-events-none',
                          )}
                          role="radiogroup"
                          aria-label="Subtask sort order"
                          data-testid="toggle-sort-mode"
                        >
                          <label
                            className={cn(
                              'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                              sortMode === SubtaskSortMode.INHERIT
                                ? 'bg-secondary text-foreground'
                                : 'bg-transparent text-muted-foreground',
                            )}
                            data-testid="toggle-sort-inherit"
                          >
                            <input
                              type="radio"
                              name="subtask-sort-mode"
                              value={SubtaskSortMode.INHERIT}
                              checked={sortMode === SubtaskSortMode.INHERIT}
                              onChange={() =>
                                sortMode !== SubtaskSortMode.INHERIT &&
                                handleSortModeToggle()
                              }
                              className="sr-only"
                            />
                            Inherit
                          </label>
                          <label
                            className={cn(
                              'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                              sortMode === SubtaskSortMode.MANUAL
                                ? 'bg-secondary text-foreground'
                                : 'bg-transparent text-muted-foreground',
                            )}
                            data-testid="toggle-sort-manual"
                          >
                            <input
                              type="radio"
                              name="subtask-sort-mode"
                              value={SubtaskSortMode.MANUAL}
                              checked={sortMode === SubtaskSortMode.MANUAL}
                              onChange={() =>
                                sortMode !== SubtaskSortMode.MANUAL &&
                                handleSortModeToggle()
                              }
                              className="sr-only"
                            />
                            Manual
                          </label>
                        </div>
                        <span
                          className="text-[11px] text-muted-foreground/70 leading-snug"
                          data-testid="text-sort-caption"
                        >
                          {sortMode === SubtaskSortMode.INHERIT
                            ? 'Subtasks follow the same sort order as the main task list.'
                            : 'Drag subtasks into your preferred order using the grip handles.'}
                        </span>
                      </div>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={directChildIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="divide-y divide-white/5">
                            {subtasks.map((subtask) => (
                              <SortableSubtaskItem
                                key={subtask.id}
                                task={subtask}
                                onEdit={onEditChild}
                                onDelete={(task) => onSubtaskDelete?.(task)}
                                onToggleComplete={(task) => {
                                  const newStatus =
                                    task.status === TaskStatus.COMPLETED
                                      ? TaskStatus.OPEN
                                      : TaskStatus.COMPLETED
                                  setTaskStatus.mutate({
                                    id: task.id,
                                    status: newStatus,
                                  })
                                }}
                                isManualMode={
                                  sortMode === SubtaskSortMode.MANUAL
                                }
                                isDragDisabled={isMutating}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => onAddChild(initialData.id)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-secondary/5 hover:bg-secondary/15 transition-colors text-sm text-muted-foreground hover:text-foreground border-t border-white/5"
                data-testid="button-add-subtask"
              >
                <Plus className={IconSizeStyle.HW4} />
                Add Subtask
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 py-2 border-t border-white/5 mt-4">
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
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
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
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
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                        }}
                        initialFocus
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
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

            {initialData?.status === TaskStatus.COMPLETED && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Time Spent
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-16 h-8 text-xs bg-secondary/20 border-white/5 text-center"
                    value={Math.floor(
                      (form.watch('inProgressTime') || 0) / 3_600_000,
                    )}
                    onChange={(e) => {
                      const hours = Number.parseInt(e.target.value) || 0
                      const currentMs = form.getValues('inProgressTime') || 0
                      const currentMinutes = Math.floor(
                        (currentMs % 3_600_000) / 60_000,
                      )
                      form.setValue(
                        'inProgressTime',
                        hours * 3_600_000 + currentMinutes * 60_000,
                      )
                    }}
                    data-testid="input-time-hours"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    className="w-16 h-8 text-xs bg-secondary/20 border-white/5 text-center"
                    value={Math.floor(
                      ((form.watch('inProgressTime') || 0) % 3_600_000) /
                        60_000,
                    )}
                    onChange={(e) => {
                      const minutes = Math.min(
                        59,
                        Number.parseInt(e.target.value) || 0,
                      )
                      const currentMs = form.getValues('inProgressTime') || 0
                      const currentHours = Math.floor(currentMs / 3_600_000)
                      form.setValue(
                        'inProgressTime',
                        currentHours * 3_600_000 + minutes * 60_000,
                      )
                    }}
                    data-testid="input-time-minutes"
                  />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 border-white/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !isValid}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && (
              <Loader2 className={cn(IconSizeStyle.HW4, 'mr-2 animate-spin')} />
            )}
            {initialData ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
