import { cn } from '@/lib/utils'

export const ScrollablePage = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={cn(
      'flex-1 overflow-y-auto bg-background text-foreground',
      className,
    )}
  >
    <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
  </div>
)
