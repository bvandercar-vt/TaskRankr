import { HelpCircle } from 'lucide-react'

import { NotificationBanner } from '@/components/primitives/NotificationBanner'
import { Routes } from '@/lib/constants'
import { InlineLink } from '../primitives/InlineText'

export const HowToUseBanner = () => (
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
