import { HelpCircle } from 'lucide-react'

import { Routes } from '@/lib/constants'
import { BannerKey, useIsBannerHidden } from '@/providers/BannersProvider'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'

export const HowToUseBanner = () => {
  if (useIsBannerHidden(BannerKey.HOW_TO_USE)) return null

  return (
    <NotificationBanner
      storageKey={`taskrankr-${BannerKey.HOW_TO_USE}-dismissed`}
      icon={HelpCircle}
      data-testid={`banner-${BannerKey.HOW_TO_USE}`}
    >
      New here?{' '}
      <InlineLink
        href={Routes.HOW_TO_USE}
        data-testid={`link-${BannerKey.HOW_TO_USE}-banner`}
      >
        Learn how to use the app
      </InlineLink>
    </NotificationBanner>
  )
}
