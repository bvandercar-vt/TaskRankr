import { isStandalonePWA } from 'is-standalone-pwa'
import { Download } from 'lucide-react'

import { Routes } from '@/lib/constants'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'

export const InstallBanner = () => (
  <NotificationBanner
    storageKey="taskrankr-install-dismissed"
    icon={Download}
    hidden={isStandalonePWA()}
    data-testid="banner-install"
  >
    Install the app!{' '}
    <InlineLink href={Routes.HOW_TO_INSTALL} data-testid="link-install-banner">
      Learn how to install
    </InlineLink>
  </NotificationBanner>
)
