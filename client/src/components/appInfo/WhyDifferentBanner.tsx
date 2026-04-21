import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { BannerKey, useIsBannerHidden } from '@/providers/BannersProvider'
import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'
import { WhyDifferentDialog } from './WhyDifferentDialog'

export const WhyDifferentBanner = () => {
  const hidden = useIsBannerHidden(BannerKey.WHY_DIFFERENT)
  const [showDialog, setShowDialog] = useState(false)

  if (hidden) return null

  return (
    <>
      <NotificationBanner id={BannerKey.WHY_DIFFERENT} icon={Sparkles}>
        Curious?{' '}
        <InlineLink onClick={() => setShowDialog(true)}>
          See what makes this app different
        </InlineLink>
      </NotificationBanner>
      <WhyDifferentDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
