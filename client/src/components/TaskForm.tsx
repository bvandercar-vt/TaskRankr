import { useCallback, useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  Plus,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { Button } from '@/components/primitives/button'
import { Calendar } from '@/components/primitives/forms/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/forms/form'
import { Input } from '@/components/primitives/forms/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/forms/select'
import { Textarea } from '@/components/primitives/forms/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/primitives/overlays/popover'
import { useSettings } from '@/hooks/use-settings'
import { useTaskParentChain } from '@/hooks/use-tasks'
import { getAttributeStyle } from '@/lib/taskStyles'
import { cn } from '@/lib/utils'
import {
  insertTaskSchema,
  SORT_FIELD_CONFIG,
  type Task,
  type TaskSortField,
} from '~/shared/schema'

const formSchema = insertTaskSchema
export type TaskFormValues = z.infer<typeof formSchema>

export interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => void
  isPending: boolean
  initialData?: Task
  parentId?: number | null
  onCancel: () => void
  onAddChild?: (parentId: number) => void
}

export const TaskForm = ({
  onSubmit,
  isPending,
  initialData,
  parentId,
  onCancel,
  onAddChild,
}: TaskFormProps) => {
  const parentChain = useTaskParentChain(parentId || undefined)
  const { settings } = useSettings()

  const getVisibility = useCallback(
    (attr: TaskSortField): boolean => {
      const key = `${attr}Visible` as const
      return settings[key]
    },
    [settings],
  )

  const getRequired = useCallback(
    (attr: TaskSortField): boolean => {
      if (!getVisibility(attr)) return false
      const key = `${attr}Required` as const
      return settings[key]
    },
    [settings, getVisibility],
  )

  const visibleAttributes = useMemo(
    () => SORT_FIELD_CONFIG.filter((attr) => getVisibility(attr.name)),
    [getVisibility],
  )

  const baseFormSchema = insertTaskSchema.omit({ userId: true })

  const formSchemaToUse = baseFormSchema

  const form = useForm<TaskFormValues>({
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

  const onSubmitWithNulls = (data: TaskFormValues) => {
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
          {parentChain.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-1 mb-2">
              {parentChain.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-secondary/10 px-2 py-0.5 rounded border border-white/5">
                    {p.name}
                  </span>
                  {idx < parentChain.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          )}
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
                                    ? getAttributeStyle(attr.name, field.value)
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
                                      getAttributeStyle(attr.name, level),
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

          {initialData && onAddChild && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full bg-secondary/10 border-white/5 hover:bg-secondary/20 h-10"
              onClick={() => onAddChild(initialData.id)}
            >
              <Plus className="w-4 h-4 mr-2" />
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
