import { useState } from 'react'
import { Sparkles } from 'lucide-react'

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
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="font-medium text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-sky-400"
          data-testid="link-why-different-banner"
        >
          See what makes this app different
        </button>
      </NotificationBanner>
      <WhyDifferentDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
