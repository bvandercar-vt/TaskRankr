/**
 * @fileoverview Card primitive components
 */

import { cn, forwardRefHelper } from '@/lib/utils'

export const Card = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn(
        'shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm',
        className,
      )}
    />
  ),
  'Card',
)

export const CardHeader = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
    />
  ),
  'CardHeader',
)

export const CardTitle = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className,
      )}
    />
  ),
  'CardTitle',
)

export const CardDescription = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
    />
  ),
  'CardDescription',
)

export const CardContent = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div {...props} ref={ref} className={cn('p-6 pt-0', className)} />
  ),
  'CardContent',
)

export const CardFooter = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
    />
  ),
  'CardFooter',
)
