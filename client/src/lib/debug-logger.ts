/**
 * @fileoverview In-memory debug logger for production diagnostics.
 * Captures timestamped action logs in a circular buffer.
 */

interface LogEntry {
  timestamp: string
  category: string
  action: string
  detail?: unknown
}

const MAX_ENTRIES = 500

class DebugLogger {
  private entries: LogEntry[] = []

  log(category: string, action: string, detail?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      detail,
    }
    this.entries.push(entry)
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES)
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  download() {
    const data = {
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      entryCount: this.entries.length,
      entries: this.entries,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskrankr-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const debugLog = new DebugLogger()
