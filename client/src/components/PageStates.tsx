export const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-secondary/50" />
      <div className="h-4 w-32 bg-secondary/50 rounded" />
    </div>
  </div>
)

export const PageError = ({ message = 'Error loading tasks. Please try again.' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center text-destructive">
    {message}
  </div>
)
