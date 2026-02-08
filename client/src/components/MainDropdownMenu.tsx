/**
 * @fileoverview Hamburger dropdown menu for the main task list page.
 */

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
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives/DropdownMenu'
import { IconSizeStyle, Routes } from '@/lib/constants'
import { authPaths } from '~/shared/constants'

interface MainDropdownMenuProps {
  isGuestMode: boolean
  exitGuestMode: () => void
  onSearchToggle: () => void
  currentPage?: 'home' | 'completed'
}

export const MainDropdownMenu = ({
  isGuestMode,
  exitGuestMode,
  onSearchToggle,
  currentPage = 'home',
}: MainDropdownMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        data-testid="button-menu"
      >
        <Menu className={IconSizeStyle.HW5} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="bg-card border-white/10 w-48">
      <DropdownMenuItem
        icon={Search}
        label="Search"
        onClick={onSearchToggle}
        data-testid="menu-item-search"
      />
      {currentPage === 'home' ? (
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
)
