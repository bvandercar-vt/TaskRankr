import { z } from 'zod'

import changelogData from '../../../CHANGELOG.json'

const changelogEntrySchema = z.object({
  version: z.string(),
  date: z.string(),
  title: z.string(),
  changes: z.array(z.string()),
})

export type ChangelogEntry = z.infer<typeof changelogEntrySchema>

export const changelog: ChangelogEntry[] = z
  .array(changelogEntrySchema)
  .parse(changelogData)

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
  if (!lastSeen) return []
  const lastSeenIndex = changelog.findIndex((e) => e.version === lastSeen)
  if (lastSeenIndex === -1) return changelog
  if (lastSeenIndex === 0) return []
  return changelog.slice(0, lastSeenIndex)
}

export function hasUnseenChanges(): boolean {
  return getLastSeenVersion() !== APP_VERSION
}
