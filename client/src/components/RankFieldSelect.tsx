/**
 * @fileoverview Select component for a single rank field in the task form
 */

import type { ControllerRenderProps } from 'react-hook-form'

import {
  FormControl,
  FormItem,
  FormLabel,
} from '@/components/primitives/forms/Form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/forms/Select'
import { getRankFieldStyle } from '@/lib/rank-field-styles'
import { cn } from '@/lib/utils'
import type {
  MutateTask,
  RANK_FIELDS_CRITERIA,
  RankField,
} from '~/shared/schema'

const NONE_VALUE = 'none'

interface RankFieldSelectProps {
  attr: (typeof RANK_FIELDS_CRITERIA)[number]
  field: ControllerRenderProps<MutateTask, RankField>
  isRequired: boolean
}

export const RankFieldSelect = ({
  attr,
  field,
  isRequired,
}: RankFieldSelectProps) => {
  const hasError = isRequired && !field.value
  const showNoneOption = !isRequired

  return (
    <FormItem>
      <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {attr.label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </FormLabel>
      <Select
        onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
        value={field.value ?? NONE_VALUE}
      >
        <FormControl>
          <SelectTrigger
            className={cn(
              'bg-secondary/20 capitalize font-semibold h-10',
              hasError ? 'border-destructive/50' : 'border-white/5',
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
              value={NONE_VALUE}
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
        <p className="text-[10px] text-destructive mt-1">Required</p>
      )}
    </FormItem>
  )
}
