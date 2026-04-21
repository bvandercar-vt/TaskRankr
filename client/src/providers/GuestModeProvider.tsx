/**
 * @fileoverview Guest-mode flag for trying the app without authentication.
 *
 * Manages guest mode state for trying the app without authentication (local
 * only, no API sync).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { EmptyObject } from 'type-fest'

import { useBannersMutations } from '@/providers/BannersProvider'

interface GuestModeContextValue {
  isGuestMode: boolean
  enterGuestMode: () => void
  exitGuestMode: () => void
}

const GuestModeContext = createContext<GuestModeContextValue | null>(null)

export const GuestModeProvider = ({
  children,
}: React.PropsWithChildren<EmptyObject>) => {
  const [isGuestMode, setIsGuestMode] = useState(false)
  const { hideBannersByUrlParam, clearHiddenBanners } = useBannersMutations()

  const enterGuestMode = useCallback(() => {
    setIsGuestMode(true)
    hideBannersByUrlParam()
  }, [hideBannersByUrlParam])

  const exitGuestMode = useCallback(() => {
    setIsGuestMode(false)
    clearHiddenBanners()
  }, [clearHiddenBanners])

  const value = useMemo(
    () => ({ isGuestMode, enterGuestMode, exitGuestMode }),
    [isGuestMode, enterGuestMode, exitGuestMode],
  )

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  )
}

export const useGuestMode = () => {
  const context = useContext(GuestModeContext)
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider')
  }
  return context
}
