/**
 * @fileoverview Collapsible sort order info component showing primary/secondary sort criteria.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { IconSizeStyle } from '@/lib/constants'
import { getRankFieldStyle } from '@/lib/rank-field-styles'
import { cn } from '@/lib/utils'
import {
  Ease,
  Enjoyment,
  Priority,
  type RankFieldValueMap,
  SortOption,
  Time,
} from '~/shared/schema'

const SORT_INFO_ATTR_LABELS = {
  priority: 'Priority',
  ease: 'Ease',
  enjoyment: 'Enjoyment',
  time: 'Time',
  date: 'Date Created',
} as const satisfies Record<SortOption, string>

const SORT_INFO_CONFIG: {
  name: string
  criteria: {
    attr: SortOption
    value: string
  }[]
}[] = [
  {
    name: SORT_INFO_ATTR_LABELS.priority,
    criteria: [
      { attr: SortOption.PRIORITY, value: Priority.HIGHEST },
      { attr: SortOption.EASE, value: Ease.EASIEST },
      { attr: SortOption.ENJOYMENT, value: Enjoyment.HIGHEST },
    ],
  },
  {
    name: SORT_INFO_ATTR_LABELS.ease,
    criteria: [
      { attr: SortOption.EASE, value: Ease.EASIEST },
      { attr: SortOption.PRIORITY, value: Priority.HIGHEST },
      { attr: SortOption.ENJOYMENT, value: Enjoyment.HIGHEST },
    ],
  },
  {
    name: SORT_INFO_ATTR_LABELS.enjoyment,
    criteria: [
      { attr: SortOption.ENJOYMENT, value: Enjoyment.HIGHEST },
      { attr: SortOption.PRIORITY, value: Priority.HIGHEST },
      { attr: SortOption.EASE, value: Ease.EASIEST },
    ],
  },
  {
    name: SORT_INFO_ATTR_LABELS.time,
    criteria: [
      { attr: SortOption.TIME, value: Time.LOWEST },
      { attr: SortOption.PRIORITY, value: Priority.HIGHEST },
      { attr: SortOption.EASE, value: Ease.EASIEST },
    ],
  },
  {
    name: SORT_INFO_ATTR_LABELS.date,
    criteria: [{ attr: SortOption.DATE, value: 'newest' }],
  },
]

interface SortInfoProps {
  defaultExpanded?: boolean
  testIdPrefix?: string
}

export const SortInfo = ({
  defaultExpanded = false,
  testIdPrefix = '',
}: SortInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const prefix = testIdPrefix ? `${testIdPrefix}-` : ''

  return (
    <div className="p-4 bg-card rounded-lg border border-white/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-start gap-2 cursor-pointer"
        data-testid={`${prefix}button-sort-info-toggle`}
        type="button"
      >
        <h3 className="font-semibold text-foreground">Sort Info</h3>
        <ChevronDown
          className={cn(
            IconSizeStyle.HW4,
            'text-muted-foreground transition-transform',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
      {isExpanded && (
        <div className="mt-3" data-testid={`${prefix}sort-info-content`}>
          <p className="text-xs text-muted-foreground mb-3 text-center">
            When tasks have the same value, they are sorted by secondary
            attributes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {SORT_INFO_CONFIG.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-secondary/20 rounded-md"
                data-testid={`${prefix}sort-info-${item.name.toLowerCase()}`}
              >
                <p className="font-medium text-foreground mb-1">{item.name}</p>
                <ol
                  className={cn(
                    'text-xs list-decimal list-inside',
                    item.criteria.length > 1 && 'space-y-0.5',
                  )}
                >
                  {item.criteria.map((c) => {
                    const style =
                      c.attr !== SortOption.DATE
                        ? getRankFieldStyle(
                            c.attr,
                            c.value satisfies string as RankFieldValueMap[typeof c.attr],
                            '',
                          )
                        : ''
                    return (
                      <li
                        key={`${c.attr} ${c.value}`}
                        className="text-muted-foreground"
                      >
                        {SORT_INFO_ATTR_LABELS[c.attr]} (
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
    </div>
  )
}
