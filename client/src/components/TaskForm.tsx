/**
 * @fileoverview Form component for creating and editing tasks
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
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
import { useDeleteTask, useTaskParentChain, useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { getRankFieldStyle } from '@/lib/rank-field-styles'
import { cn } from '@/lib/utils'
import {
  insertTaskSchema,
  type MutateTaskRequest,
  RANK_FIELDS_CRITERIA,
  type RankField,
  type Task,
} from '~/shared/schema'

export interface TaskFormProps {
  onSubmit: (data: MutateTaskRequest) => void
  isPending: boolean
  initialData?: Task
  parentId?: number | null
  onCancel: () => void
  onAddChild?: (parentId: number) => void
  onEditChild?: (task: Task) => void
}

export const TaskForm = ({
  onSubmit,
  isPending,
  initialData,
  parentId,
  onCancel,
  onAddChild,
  onEditChild,
}: TaskFormProps) => {
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)
  const [subtaskToDelete, setSubtaskToDelete] = useState<{
    id: number
    name: string
  } | null>(null)
  const parentChain = useTaskParentChain(parentId || undefined)
  const { settings } = useSettings()
  const { data: allTasks } = useTasks()
  const deleteTask = useDeleteTask()

  const subtasks = useMemo(() => {
    if (!initialData || !allTasks) return []
    const flattenTasks = (tasks: typeof allTasks): typeof allTasks => {
      const result: typeof allTasks = []
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
      thisParentId: number,
      depth: number,
    ): Array<(typeof allTasks)[number] & { depth: number }> => {
      const children = flatList.filter((t) => t.parentId === thisParentId)
      const result: Array<(typeof allTasks)[number] & { depth: number }> = []
      for (const child of children) {
        result.push({ ...child, depth })
        result.push(...collectDescendants(child.id, depth + 1))
      }
      return result
    }

    return collectDescendants(initialData.id, 0)
  }, [initialData, allTasks])

  const getVisibility = useCallback(
    (attr: RankField) => getIsVisible(attr, settings),
    [settings],
  )

  const getRequired = useCallback(
    (attr: RankField) =>
      getIsVisible(attr, settings) && getIsRequired(attr, settings),
    [settings],
  )

  const visibleAttributes = useMemo(
    () => RANK_FIELDS_CRITERIA.filter((attr) => getVisibility(attr.name)),
    [getVisibility],
  )

  const baseFormSchema = insertTaskSchema.omit({ userId: true })

  const formSchemaToUse = baseFormSchema

  const form = useForm<MutateTaskRequest>({
    resolver: zodResolver(formSchemaToUse),
    mode: 'onChange',
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          priority: initialData.priority || 'none',
          ease: initialData.ease || 'none',
          enjoyment: initialData.enjoyment || 'none',
          time: initialData.time || 'none',
          parentId: initialData.parentId,
          createdAt: initialData.createdAt
            ? new Date(initialData.createdAt)
            : new Date(),
          completedAt: initialData.completedAt
            ? new Date(initialData.completedAt)
            : null,
          inProgressTime: initialData.inProgressTime || 0,
        }
      : {
          name: '',
          description: '',
          priority: 'none',
          ease: 'none',
          enjoyment: 'none',
          time: 'none',
          parentId: parentId || null,
          createdAt: new Date(),
          inProgressTime: 0,
        },
  })

  // Use useEffect to reset form when initialData or parentId changes
  // to ensure "Add Subtask" dialog is clean.
  useEffect(() => {
    form.reset(
      initialData
        ? {
            name: initialData.name,
            description: initialData.description || '',
            priority: initialData.priority || 'none',
            ease: initialData.ease || 'none',
            enjoyment: initialData.enjoyment || 'none',
            time: initialData.time || 'none',
            parentId: initialData.parentId,
            createdAt: initialData.createdAt
              ? new Date(initialData.createdAt)
              : new Date(),
            completedAt: initialData.completedAt
              ? new Date(initialData.completedAt)
              : null,
            inProgressTime: initialData.inProgressTime || 0,
          }
        : {
            name: '',
            description: '',
            priority: 'none',
            ease: 'none',
            enjoyment: 'none',
            time: 'none',
            parentId: parentId || null,
            createdAt: new Date(),
            inProgressTime: 0,
          },
    )
  }, [initialData, parentId, form])

  const onSubmitWithNulls = (data: MutateTaskRequest) => {
    const formattedData = {
      ...data,
      priority: data.priority === 'none' ? null : data.priority,
      ease: data.ease === 'none' ? null : data.ease,
      enjoyment: data.enjoyment === 'none' ? null : data.enjoyment,
      time: data.time === 'none' ? null : data.time,
    }
    onSubmit(formattedData)
  }

  const watchedValues = form.watch()

  const requiredAttributesFilled = useMemo(() => {
    for (const attr of visibleAttributes) {
      if (getRequired(attr.name)) {
        const value = watchedValues[attr.name]
        if (!value || value === 'none') {
          return false
        }
      }
    }
    return true
  }, [watchedValues, visibleAttributes, getRequired])

  const isValid = form.formState.isValid && requiredAttributesFilled

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitWithNulls)}
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

          {visibleAttributes.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {visibleAttributes.map((attr) => {
                const isRequired = getRequired(attr.name)
                const showNoneOption = !isRequired

                return (
                  <FormField
                    key={attr.name}
                    control={form.control}
                    name={attr.name}
                    render={({ field }) => {
                      const hasError =
                        isRequired && (!field.value || field.value === 'none')
                      return (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {attr.label}
                            {isRequired && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  'bg-secondary/20 capitalize font-semibold h-10',
                                  hasError
                                    ? 'border-destructive/50'
                                    : 'border-white/5',
                                  field.value && field.value !== 'none'
                                    ? getRankFieldStyle(attr.name, field.value)
                                    : 'text-muted-foreground',
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
                              {attr.levels
                                .filter((level) => level !== 'none')
                                .map((level) => (
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
                    className="bg-secondary/20 border-white/5 min-h-[120px] resize-none focus-visible:ring-primary/50"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />

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

            {initialData?.status === 'completed' &&
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

            {initialData?.status === 'completed' && (
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

          {initialData && subtasks.length > 0 && (
            <div className="border border-white/10 rounded-lg overflow-hidden">
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
                <div className="divide-y divide-white/5">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between gap-2 px-3 py-0 bg-secondary/5"
                      style={{ paddingLeft: `${12 + subtask.depth * 16}px` }}
                      data-testid={`subtask-row-${subtask.id}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {subtask.depth > 0 && (
                          <span className="text-muted-foreground/50 text-xs leading-none">
                            └
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-sm truncate',
                            subtask.status === 'completed' &&
                              'line-through text-muted-foreground',
                          )}
                        >
                          {subtask.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {onEditChild && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditChild(subtask as Task)}
                            data-testid={`button-edit-subtask-${subtask.id}`}
                          >
                            <Pencil className={IconSizeStyle.HW4} />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSubtaskToDelete({
                              id: subtask.id,
                              name: subtask.name,
                            })
                          }
                          data-testid={`button-delete-subtask-${subtask.id}`}
                        >
                          <Trash2
                            className={cn(
                              IconSizeStyle.HW4,
                              'text-destructive',
                            )}
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {initialData && onAddChild && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full bg-secondary/10 border-white/5 hover:bg-secondary/20 h-10"
              onClick={() => onAddChild(initialData.id)}
            >
              <Plus className={cn(IconSizeStyle.HW4, 'mr-2')} />
              Add Subtask
            </Button>
          )}
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
      <ConfirmDeleteDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        taskName={subtaskToDelete?.name ?? ''}
        onConfirm={() => {
          if (subtaskToDelete) {
            deleteTask.mutate(subtaskToDelete.id)
            setSubtaskToDelete(null)
          }
        }}
      />
    </Form>
  )
}
