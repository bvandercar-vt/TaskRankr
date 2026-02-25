export interface ChangelogEntry {
  version: string
  date: string
  title: string
  changes: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-02-25',
    title: 'Changelog & Version Tracking',
    changes: [
      'Added "What\'s New" dialog to highlight updates after each release',
      'Version number now displayed in Settings',
      'Sessions now persist across app updates — no more unexpected logouts',
    ],
  },
]

export const APP_VERSION = changelog[0].version

const LAST_SEEN_VERSION_KEY = 'taskrankr-last-seen-version'

export function getLastSeenVersion(): string | null {
  return localStorage.getItem(LAST_SEEN_VERSION_KEY)
}

export function setLastSeenVersion(version: string) {
  localStorage.setItem(LAST_SEEN_VERSION_KEY, version)
}

export function getUnseenEntries(): ChangelogEntry[] {
  const lastSeen = getLastSeenVersion()
  if (!lastSeen) return changelog
  const lastSeenIndex = changelog.findIndex((e) => e.version === lastSeen)
  if (lastSeenIndex === -1) return changelog
  if (lastSeenIndex === 0) return []
  return changelog.slice(0, lastSeenIndex)
}

export function hasUnseenChanges(): boolean {
  return getLastSeenVersion() !== APP_VERSION
}
