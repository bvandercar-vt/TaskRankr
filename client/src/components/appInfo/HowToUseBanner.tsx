import { HelpCircle } from 'lucide-react'

import { Routes } from '@/lib/constants'
import { BannerKey, useGuestMode } from '@/providers/GuestModeProvider'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'

export const HowToUseBanner = () => {
  const { hiddenBanners } = useGuestMode()

  if (hiddenBanners.has(BannerKey.HOW_TO_USE)) return null

  return (
    <NotificationBanner
      storageKey="taskrankr-how-to-use-dismissed"
      icon={HelpCircle}
      data-testid="banner-how-to-use"
    >
      New here?{' '}
      <InlineLink href={Routes.HOW_TO_USE} data-testid="link-how-to-use-banner">
        Learn how to use the app
      </InlineLink>
    </NotificationBanner>
  )
}
