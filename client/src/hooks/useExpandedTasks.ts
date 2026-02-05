/**
 * @fileoverview Hook to manage expanded/collapsed state of parent tasks.
 * Persists state in localStorage so expansion survives parent collapse/expand.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useGuestMode } from '@/components/GuestModeProvider'

const STORAGE_KEY_AUTH = 'taskrankr-auth-expanded'
const STORAGE_KEY_GUEST = 'taskrankr-guest-expanded'

interface ExpandedTasksContextValue {
  expandedIds: Set<number>
  toggleExpanded: (taskId: number) => void
  isExpanded: (taskId: number) => boolean
}

export const ExpandedTasksContext = createContext<ExpandedTasksContextValue | null>(null)

export const useExpandedTasks = () => {
  const context = useContext(ExpandedTasksContext)
  if (!context) {
    throw new Error('useExpandedTasks must be used within ExpandedTasksProvider')
  }
  return context
}

export const useExpandedTasksState = () => {
  const { isGuestMode } = useGuestMode()
  const storageKey = isGuestMode ? STORAGE_KEY_GUEST : STORAGE_KEY_AUTH

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as number[]
        return new Set(parsed)
      }
    } catch {
      // Ignore parse errors
    }
    return new Set()
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(expandedIds)))
    } catch {
      // Ignore storage errors
    }
  }, [expandedIds, storageKey])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as number[]
        setExpandedIds(new Set(parsed))
      } else {
        setExpandedIds(new Set())
      }
    } catch {
      setExpandedIds(new Set())
    }
  }, [storageKey])

  const toggleExpanded = useCallback((taskId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const isExpanded = useCallback(
    (taskId: number) => expandedIds.has(taskId),
    [expandedIds]
  )

  return { expandedIds, toggleExpanded, isExpanded }
}
