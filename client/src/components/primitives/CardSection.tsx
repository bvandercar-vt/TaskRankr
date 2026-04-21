import type React from 'react'

export const CardSection = ({
  title,
  'data-testid': testId,
  children,
}: React.PropsWithChildren<{
  title: string
  'data-testid': string
}>) => (
  <section data-testid={testId}>
    <h2 className="text-lg font-semibold mb-3 text-primary">{title}</h2>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
)
