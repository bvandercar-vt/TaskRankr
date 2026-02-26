import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { BannerKey, useGuestMode } from '@/providers/GuestModeProvider'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'
import { WhyDifferentDialog } from './WhyDifferentDialog'

export const WhyDifferentBanner = () => {
  const { hiddenBanners } = useGuestMode()
  const [showDialog, setShowDialog] = useState(false)

  if (hiddenBanners.has(BannerKey.WHY_DIFFERENT)) return null

  return (
    <>
      <NotificationBanner
        storageKey="taskrankr-why-different-dismissed"
        icon={Sparkles}
        data-testid="banner-why-different"
      >
        Curious?{' '}
        <InlineLink onClick={() => setShowDialog(true)}>
          See what makes this app different
        </InlineLink>
      </NotificationBanner>
      <WhyDifferentDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
