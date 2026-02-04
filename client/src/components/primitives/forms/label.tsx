/**
 * @fileoverview Form label component built on @radix-ui primitives.
 */

import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn, forwardRefHelper } from '@/lib/utils'

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

export const Label = forwardRefHelper<
  typeof LabelPrimitive.Root,
  VariantProps<typeof labelVariants>
>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  ),
  LabelPrimitive.Root,
)
