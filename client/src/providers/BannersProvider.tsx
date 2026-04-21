/**
 * @fileoverview Cross-cutting banner-suppression state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { intersection } from 'es-toolkit'
import type { EmptyObject } from 'type-fest'

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
}: React.PropsWithChildren<EmptyObject>) => {
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

  const hideBannersByUrlParam = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const hideParam = params.get('hide')

    if (hideParam) {
      hideBanners(
        intersection<BannerKey>(
          hideParam.split(',') as BannerKey[],
          Object.values(BannerKey),
        ),
      )
    }
  }, [hideBanners])

  return { hideBanners, clearHiddenBanners, hideBannersByUrlParam }
}
