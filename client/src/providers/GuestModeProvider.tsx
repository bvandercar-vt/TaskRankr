/**
 * @fileoverview Guest-mode flag for trying the app without authentication.
 *
 * `enterGuestMode(hideBanners?)` flips the flag and seeds the cross-cutting
 * suppression set in `BannersProvider`; `exitGuestMode` clears it. Banner
 * suppression itself lives in `BannersProvider` — see that file for why.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import {
  type BannerKey,
  useBannersMutations,
} from '@/providers/BannersProvider'

interface GuestModeContextValue {
  isGuestMode: boolean
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
  const { hideBanners, clearHiddenBanners } = useBannersMutations()

  const enterGuestMode = useCallback(
    (toHide?: BannerKey[]) => {
      setIsGuestMode(true)
      hideBanners(toHide ?? [])
    },
    [hideBanners],
  )
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
