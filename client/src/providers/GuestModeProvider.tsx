/**
 * @fileoverview Guest mode context provider.
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

export enum BannerKey {
  LOG_IN = 'log-in',
  WHY_DIFFERENT = 'why-different',
  HOW_TO_USE = 'how-to-use',
  INSTALL = 'install',
}

interface GuestModeContextValue {
  isGuestMode: boolean
  hiddenBanners: Set<BannerKey>
  enterGuestMode: (hideBanners?: BannerKey[]) => void
  exitGuestMode: () => void
}

const GuestModeContext = createContext<GuestModeContextValue | null>(null)

export const GuestModeProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [hiddenBanners, setHiddenBanners] = useState<Set<BannerKey>>(new Set())

  const enterGuestMode = useCallback((hideBanners?: BannerKey[]) => {
    setIsGuestMode(true)
    setHiddenBanners(hideBanners?.length ? new Set(hideBanners) : new Set())
  }, [])
  const exitGuestMode = useCallback(() => {
    setIsGuestMode(false)
    setHiddenBanners(new Set())
  }, [])

  const value = useMemo(
    () => ({
      isGuestMode,
      hiddenBanners,
      enterGuestMode,
      exitGuestMode,
    }),
    [isGuestMode, hiddenBanners, enterGuestMode, exitGuestMode],
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
