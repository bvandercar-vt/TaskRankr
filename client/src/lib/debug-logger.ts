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

  private getLocalState(): Record<string, unknown> {
    const state: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('taskrankr-')) continue
      const raw = localStorage.getItem(key)
      if (raw === null) continue
      try {
        state[key] = JSON.parse(raw)
      } catch {
        state[key] = raw
      }
    }
    return state
  }

  private async fetchServerData(): Promise<{
    tasks: unknown
    settings: unknown
  } | null> {
    try {
      const [tasksRes, settingsRes] = await Promise.all([
        fetch('/api/tasks', { credentials: 'include' }),
        fetch('/api/settings', { credentials: 'include' }),
      ])
      const tasks = tasksRes.ok
        ? await tasksRes.json()
        : { error: tasksRes.statusText }
      const settings = settingsRes.ok
        ? await settingsRes.json()
        : { error: settingsRes.statusText }
      return { tasks, settings }
    } catch (err) {
      return { tasks: { error: String(err) }, settings: { error: String(err) } }
    }
  }

  async download(isGuestMode = false) {
    const serverData = isGuestMode ? null : await this.fetchServerData()

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isGuestMode,
      entryCount: this.entries.length,
      localState: this.getLocalState(),
    }

    if (serverData) {
      data.serverData = serverData
    }

    data.entries = this.entries

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
