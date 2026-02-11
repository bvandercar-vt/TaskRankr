export const CardSection = ({
  title,
  'data-testid': testId,
  children,
}: {
  title: string
  'data-testid': string
  children: React.ReactNode
}) => (
  <section data-testid={testId}>
    <h2 className="text-lg font-semibold mb-3 text-primary">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
)
