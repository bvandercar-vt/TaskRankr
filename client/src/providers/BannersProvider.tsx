/**
 * @fileoverview Cross-cutting banner-suppression state.
 *
 * Seeded once on mount from a `?hide=key1,key2` URL param so any deep link
 * (guest entry, marketing link, etc.) can pre-suppress noise. The set lives
 * for the session — there are no external writers today.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { intersection } from 'es-toolkit'
import type { EmptyObject } from 'type-fest'

export enum BannerKey {
  LOG_IN = 'log-in',
  WHY_DIFFERENT = 'why-different',
  HOW_TO_USE = 'how-to-use',
  INSTALL = 'install',
}

const readHideParam = (): BannerKey[] => {
  const hideParam = new URLSearchParams(window.location.search).get('hide')
  if (!hideParam) return []
  return intersection<BannerKey>(
    hideParam.split(',') as BannerKey[],
    Object.values(BannerKey),
  )
}

const BannersContext = createContext<Set<BannerKey> | null>(null)

export const BannersProvider = ({
  children,
}: React.PropsWithChildren<EmptyObject>) => {
  const [hiddenBanners, setHiddenBanners] = useState<Set<BannerKey>>(
    () => new Set(readHideParam()),
  )

  useEffect(() => {
    const fromUrl = readHideParam()
    if (fromUrl.length > 0) setHiddenBanners(new Set(fromUrl))
  }, [])

  return (
    <BannersContext.Provider value={hiddenBanners}>
      {children}
    </BannersContext.Provider>
  )
}

/** Whether `key` is currently suppressed. */
export const useIsBannerHidden = (key: BannerKey): boolean => {
  const hidden = useContext(BannersContext)
  if (!hidden) {
    throw new Error('useIsBannerHidden must be used within a BannersProvider')
  }
  return hidden.has(key)
}
