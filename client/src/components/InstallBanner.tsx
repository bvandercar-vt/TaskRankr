import { isStandalonePWA } from 'is-standalone-pwa'
import { Download } from 'lucide-react'
import { Link } from 'wouter'

import { NotificationBanner } from '@/components/primitives/NotificationBanner'
import { Routes } from '@/lib/constants'

export const InstallBanner = () => (
  <NotificationBanner
    storageKey="taskrankr-install-dismissed"
    icon={Download}
    hidden={isStandalonePWA()}
    data-testid="banner-install"
  >
    Install the app!{' '}
    <Link href={Routes.HOW_TO_INSTALL}>
      <span
        className="text-primary underline underline-offset-2 cursor-pointer"
        data-testid="link-install-banner"
      >
        Learn how to install
      </span>
    </Link>
  </NotificationBanner>
)
