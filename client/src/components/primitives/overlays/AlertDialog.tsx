/**
 * @fileoverview Alert dialog component for confirmations. Modal dialog built on
 * @radix-ui primitives.
 */

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { X } from 'lucide-react'

import { cn, forwardRefHelper } from '@/lib/utils'
import { Button, buttonVariants } from '../Button'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Overlay
      {...props}
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
    />
  ),
  AlertDialogPrimitive.Overlay,
)

export const AlertDialogContent = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        {...props}
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          className,
        )}
      />
    </AlertDialogPortal>
  ),
  AlertDialogPrimitive.Content,
)

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
  />
)

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
  />
)

export const AlertDialogTitle = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title
      {...props}
      ref={ref}
      className={cn('text-lg font-semibold', className)}
    />
  ),
  AlertDialogPrimitive.Title,
)

export const AlertDialogDescription = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description
      {...props}
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
    />
  ),
  AlertDialogPrimitive.Description,
)

export const AlertDialogAction = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Action
      {...props}
      ref={ref}
      className={cn(buttonVariants(), className)}
    />
  ),
  AlertDialogPrimitive.Action,
)

export const AlertDialogCancel = forwardRefHelper(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel
      {...props}
      ref={ref}
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'mt-2 sm:mt-0',
        className,
      )}
    />
  ),
  AlertDialogPrimitive.Cancel,
)

export const AlertDialogCloseButton = ({
  onClose,
  'data-testid': testId,
}: {
  onClose: () => void
  'data-testid'?: string
}) => (
  <Button
    variant="ghost"
    size="icon"
    className="absolute left-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
    onClick={onClose}
    data-testid={testId}
  >
    <X className="size-4" />
  </Button>
)
