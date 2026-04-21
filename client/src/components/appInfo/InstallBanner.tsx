import { isStandalonePWA } from 'is-standalone-pwa'
import { Download } from 'lucide-react'

import { Routes } from '@/lib/constants'
import { BannerKey, useIsBannerHidden } from '@/providers/BannersProvider'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'

export const InstallBanner = () => {
  if (useIsBannerHidden(BannerKey.INSTALL)) return null

  return (
    <NotificationBanner
      storageKey={`taskrankr-${BannerKey.INSTALL}-dismissed`}
      icon={Download}
      hidden={isStandalonePWA()}
      data-testid={`banner-${BannerKey.INSTALL}`}
    >
      Install the app!{' '}
      <InlineLink
        href={Routes.HOW_TO_INSTALL}
        data-testid={`link-${BannerKey.INSTALL}-banner`}
      >
        Learn how to install
      </InlineLink>
    </NotificationBanner>
  )
}
