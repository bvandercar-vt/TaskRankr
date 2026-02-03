import { cn, forwardRefHelper } from '@/lib/utils'

export const Card = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  ),
  'Card',
)

export const CardHeader = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ),
  'CardHeader',
)

export const CardTitle = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  'CardTitle',
)

export const CardDescription = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
  'CardDescription',
)

export const CardContent = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
  'CardContent',
)

export const CardFooter = forwardRefHelper<HTMLDivElement>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  ),
  'CardFooter',
)
