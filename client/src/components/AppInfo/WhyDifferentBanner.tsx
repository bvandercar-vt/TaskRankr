import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { InlineLink } from '../primitives/InlineText'
import { NotificationBanner } from '../primitives/NotificationBanner'
import { WhyDifferentDialog } from './WhyDifferentDialog'

export const WhyDifferentBanner = () => {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <NotificationBanner
        storageKey="taskrankr-why-different-dismissed"
        icon={Sparkles}
        data-testid="banner-why-different"
      >
        Curious?{' '}
        <InlineLink
          onClick={() => setShowDialog(true)}
          data-testid="link-why-different-banner"
        >
          See what makes this app different
        </InlineLink>
      </NotificationBanner>
      <WhyDifferentDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
