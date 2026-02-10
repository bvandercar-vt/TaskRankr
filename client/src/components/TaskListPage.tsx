// biome-ignore lint/style/useFilenamingConvention: is fine

import type React from 'react'

import { DropdownMenuHeader } from './DropdownMenuHeader'
import { HowToUseBanner } from './HowToUseBanner'
import { PageLoading } from './PageStates'

export const TaskListPageHeader = ({
  title,
  showTitle = true,
  ColumnHeaders,
  searchVal,
  setSearchVal,
}: {
  title: React.ReactNode
  showTitle?: boolean
  ColumnHeaders: React.ReactNode
  searchVal: string
  setSearchVal: (value: string) => void
}) => (
  <div className="shrink-0 max-w-5xl w-full mx-auto px-2 sm:px-4 pt-5">
    <HowToUseBanner />

    <h1
      className={
        showTitle ? 'text-2xl font-bold tracking-tight mb-2 px-2' : 'sr-only'
      }
    >
      {title}
    </h1>

    <DropdownMenuHeader searchVal={searchVal} onSearchChange={setSearchVal}>
      {ColumnHeaders}
    </DropdownMenuHeader>
  </div>
)

export const TaskListTreeLayout = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <div className="flex-1 min-h-0 overflow-y-auto pb-32">
    <div className="max-w-5xl mx-auto px-2 sm:px-4 space-y-1">{children}</div>
  </div>
)

export const TaskListPageWrapper = ({
  children,
  isLoading,
}: React.PropsWithChildren<{ isLoading: boolean }>) => {
  if (isLoading) return <PageLoading />

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {children}
    </div>
  )
}
