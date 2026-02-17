import { HelpCircle } from 'lucide-react'
import { Link } from 'wouter'

import { NotificationBanner } from '@/components/primitives/NotificationBanner'
import { Routes } from '@/lib/constants'

export const HowToUseBanner = () => (
  <NotificationBanner
    storageKey="taskrankr-how-to-use-dismissed"
    icon={HelpCircle}
    data-testid="banner-how-to-use"
  >
    New here?{' '}
    <Link href={Routes.HOW_TO_USE}>
      <span
        className="text-primary underline underline-offset-2 cursor-pointer"
        data-testid="link-how-to-use-banner"
      >
        Learn how to use the app
      </span>
    </Link>
  </NotificationBanner>
)
