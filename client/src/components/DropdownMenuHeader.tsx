/**
 * @fileoverview Page header with hamburger dropdown menu and collapsible search.
 * Accepts `children` rendered to the right of the menu trigger, and an
 * optional search bar that slides in below the header row.
 */

import { useState } from 'react'
import {
  CheckCircle2,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
} from 'lucide-react'
import { Link, useLocation } from 'wouter'

import { Button } from '@/components/primitives/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives/DropdownMenu'
import { SearchInput } from '@/components/SearchInput'
import { IconSize, Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'
import { useGuestMode } from './providers/GuestModeProvider'

const Title = ({
  title,
  showTitle,
  className,
}: {
  title: React.ReactNode
  showTitle?: boolean
  className?: string
}) =>
  title && (
    <h1
      className={
        showTitle
          ? cn('text-2xl font-bold tracking-tight', className)
          : 'sr-only'
      }
    >
      {title}
    </h1>
  )

interface DropdownMenuHeaderProps {
  title?: React.ReactNode
  showTitle?: boolean
  searchVal: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
}

export const DropdownMenuHeader = ({
  title,
  showTitle = true,
  searchVal,
  onSearchChange,
  children,
}: DropdownMenuHeaderProps) => {
  const { isGuestMode, exitGuestMode } = useGuestMode()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [location] = useLocation()
  const isHome = location === Routes.HOME

  const toggleSearch = () => {
    setIsSearchExpanded((prev) => {
      if (prev) onSearchChange('')
      return !prev
    })
  }

  return (
    <>
      <Title
        title={title}
        showTitle={showTitle}
        className="mb-2 px-2 sm:hidden"
      />
      <div className="flex items-center gap-1 mb-2 pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              data-testid="button-menu"
            >
              <Menu className={IconSize.HW5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-card border-white/10 w-48"
          >
            <DropdownMenuItem
              icon={Search}
              label="Search"
              onClick={toggleSearch}
              data-testid="menu-item-search"
            />
            {isHome ? (
              <Link href={Routes.COMPLETED}>
                <DropdownMenuItem
                  icon={CheckCircle2}
                  label="Completed Tasks"
                  data-testid="menu-item-completed"
                />
              </Link>
            ) : (
              <Link href={Routes.HOME}>
                <DropdownMenuItem
                  icon={Home}
                  label="Home"
                  data-testid="menu-item-home"
                />
              </Link>
            )}
            <Link href={Routes.SETTINGS}>
              <DropdownMenuItem
                icon={Settings}
                label="Settings"
                data-testid="menu-item-settings"
              />
            </Link>
            <Link href={Routes.HOW_TO_USE}>
              <DropdownMenuItem
                icon={HelpCircle}
                label="How To Use"
                data-testid="menu-item-how-to-use"
              />
            </Link>
            {isGuestMode && (
              <>
                <DropdownMenuSeparator />
                <a href={authPaths.login}>
                  <DropdownMenuItem
                    icon={LogIn}
                    label="Sign Up"
                    data-testid="menu-item-signup"
                  />
                </a>
                <DropdownMenuItem
                  icon={LogOut}
                  label="Exit Guest Mode"
                  onClick={exitGuestMode}
                  data-testid="menu-item-exit-guest"
                />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Title
          title={title}
          showTitle={showTitle}
          className="hidden sm:block px-2"
        />

        <div className="flex-1" />

        {children}
      </div>

      {isSearchExpanded && (
        <SearchInput
          value={searchVal}
          onChange={onSearchChange}
          autoFocus
          onBlur={() => !searchVal && setIsSearchExpanded(false)}
          className="mb-3 mx-1"
        />
      )}
    </>
  )
}
