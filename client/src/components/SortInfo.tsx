/**
 * @fileoverview Collapsible sort order info component showing primary/secondary sort criteria.
 */

import { CollapsibleCard } from '@/components/primitives/CollapsibleCard'
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
}

export const SortInfo = ({ defaultExpanded = false }: SortInfoProps) => (
  <CollapsibleCard
    title={<h3 className="font-semibold text-foreground">Sort Info</h3>}
    defaultOpen={defaultExpanded}
    contentClassName="mt-3"
    data-testid="button-sort-info-toggle"
  >
    <p className="text-xs text-muted-foreground mb-3 text-center">
      When tasks have the same value, they are sorted by secondary attributes.
    </p>
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"
      data-testid="sort-info-content"
    >
      {SORT_INFO_CONFIG.map((item) => (
        <div
          key={item.name}
          className="p-3 bg-secondary/20 rounded-md"
          data-testid={`sort-info-${item.name.toLowerCase()}`}
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
                    <span className={cn('font-medium', style)}>{c.value}</span>
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
  </CollapsibleCard>
)
