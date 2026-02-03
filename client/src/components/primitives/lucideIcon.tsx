import type { LucideIcon } from 'lucide-react'

export const Icon = ({
  icon: IconElement,
  ...props
}: React.ComponentProps<LucideIcon> & { icon: LucideIcon }) => (
  <IconElement {...props} />
)
