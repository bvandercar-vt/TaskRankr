import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Download, Mail, RefreshCw } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { IconSize } from '@/lib/constants'
import { debugLog } from '@/lib/debug-logger'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    debugLog.log('ErrorBoundary', 'uncaught_error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children
    }

    const errorText = [this.state.error.message, this.state.error.stack]
      .filter(Boolean)
      .join('\n\n')

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
        <div
          className="w-full max-w-lg rounded-lg border border-red-500/30 bg-red-950 p-6 shadow-2xl"
          data-testid="dialog-error-boundary"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className={cn(IconSize.HW5, 'text-red-400')} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-100">
                Something went wrong
              </h2>
              <p className="text-sm text-red-300/80">
                An unexpected error occurred
              </p>
            </div>
          </div>

          <div
            className="mb-4 max-h-48 overflow-y-auto rounded-md bg-red-900/50 border border-red-500/20 p-3"
            data-testid="text-error-details"
          >
            <pre className="whitespace-pre-wrap break-words text-xs text-red-200 font-mono">
              {errorText}
            </pre>
          </div>

          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-900/30 p-4">
            <h3 className="font-semibold text-red-100">Help & Feedback</h3>
            <p className="text-sm text-red-300/70">
              Support / Bug Report / Feature Suggestions
            </p>
            <div className="flex flex-col items-center gap-3 mt-3">
              <a
                href="mailto:taskrankr@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover-elevate rounded-md px-1"
                data-testid="link-error-contact-email"
              >
                <Mail className={IconSize.HW4} />
                taskrankr@gmail.com
              </a>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-500/30 text-red-200 hover:text-red-100"
                onClick={() => debugLog.download(true)}
                data-testid="button-error-download-debug-logs"
              >
                <Download className={IconSize.HW4} />
                Download Debug Logs
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-red-500/30 text-red-200 hover:text-red-100"
            onClick={() => window.location.reload()}
            data-testid="button-error-reload"
          >
            <RefreshCw className={IconSize.HW4} />
            Reload App
          </Button>
        </div>
      </div>
    )
  }
}
