/**
 * @fileoverview Cross-cutting banner-suppression state.
 *
 * Owns `hiddenBanners` — the set of banners that should not render right now.
 * Today the only writer is `GuestModeProvider.enterGuestMode`, which seeds the
 * set from a URL param so a "try as guest" deep link can pre-suppress noise
 * (e.g. the log-in nag). The set is cleared on `exitGuestMode`. Decoupled
 * from `GuestModeProvider` so banner components don't have to depend on
 * guest-mode state, and so future writers (e.g. a settings-driven "hide
 * helper banners" toggle) have a natural home.
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

interface BannersContextValue {
  hiddenBanners: Set<BannerKey>
  hideBanners: (keys: BannerKey[]) => void
  clearHiddenBanners: () => void
}

const BannersContext = createContext<BannersContextValue | null>(null)

export const BannersProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [hiddenBanners, setHiddenBanners] = useState<Set<BannerKey>>(new Set())

  const hideBanners = useCallback((keys: BannerKey[]) => {
    setHiddenBanners(new Set(keys))
  }, [])

  const clearHiddenBanners = useCallback(() => {
    setHiddenBanners(new Set())
  }, [])

  const value = useMemo(
    () => ({ hiddenBanners, hideBanners, clearHiddenBanners }),
    [hiddenBanners, hideBanners, clearHiddenBanners],
  )

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

const useBanners = () => {
  const context = useContext(BannersContext)
  if (!context) {
    throw new Error('useBanners must be used within a BannersProvider')
  }
  return context
}

/** Whether `key` is currently suppressed. Stable selector for banner components. */
export const useIsBannerHidden = (key: BannerKey): boolean =>
  useBanners().hiddenBanners.has(key)

/** Mutators for code that needs to seed or clear the suppression set. */
export const useBannersMutations = () => {
  const { hideBanners, clearHiddenBanners } = useBanners()
  return { hideBanners, clearHiddenBanners }
}
