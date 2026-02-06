// biome-ignore lint/style/useFilenamingConvention: is fine
/**
 * @fileoverview Wrapper component for Lucide React icons.
 *
 * Provides an Icon component that accepts a Lucide icon as a prop,
 * enabling dynamic icon rendering while preserving all standard
 * Lucide icon props for customization.
 */

import type { LucideIcon } from 'lucide-react'

export const Icon = ({
  icon: IconElement,
  ...props
}: React.ComponentProps<LucideIcon> & { icon: LucideIcon }) => (
  <IconElement {...props} />
)
