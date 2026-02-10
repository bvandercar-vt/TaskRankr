import { Mail } from 'lucide-react'

import { IconSize } from '@/lib/constants'

export const ContactCard = ({ className }: { className?: string }) => (
  <div
    className={`p-4 bg-card rounded-lg border border-white/10  ${className ?? ''}`}
    data-testid="card-contact"
  >
    <h3 className="font-semibold text-foreground">Help & Feedback</h3>
    <p className="text-sm text-muted-foreground">
      Support / Bug Report / Feature Suggestions
    </p>
    <div className="flex justify-center mt-3">
      <a
        href="mailto:taskrankr@gmail.com"
        className="inline-flex items-center gap-2 text-sm text-purple-400 hover-elevate rounded-md px-1"
        data-testid="link-contact-email"
      >
        <Mail className={IconSize.HW4} />
        taskrankr@gmail.com
      </a>
    </div>
  </div>
)
