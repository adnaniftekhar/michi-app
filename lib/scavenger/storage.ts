import type { HuntDefinition, PlaySession } from './types'

const ADMIN_HUNTS_PREFIX = 'michi_scavenger_hunts_'
const PLAY_SESSIONS_KEY = 'michi_scavenger_play_sessions_v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function getAdminKey(userId: string): string {
  return `${ADMIN_HUNTS_PREFIX}${userId}`
}

export function getAdminHunts(userId: string): HuntDefinition[] {
  if (!isBrowser()) return []
  const raw = window.localStorage.getItem(getAdminKey(userId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as HuntDefinition[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveAdminHunts(
  userId: string,
  hunts: HuntDefinition[]
): void {
  if (!isBrowser()) return
  window.localStorage.setItem(getAdminKey(userId), JSON.stringify(hunts))
}

export function upsertAdminHunt(
  userId: string,
  hunt: HuntDefinition
): HuntDefinition[] {
  const existing = getAdminHunts(userId)
  const index = existing.findIndex((h) => h.id === hunt.id)
  const updatedAt = new Date().toISOString()
  const next: HuntDefinition =
    index >= 0 ? { ...existing[index], ...hunt, updatedAt } : { ...hunt, updatedAt }

  const all =
    index >= 0
      ? [...existing.slice(0, index), next, ...existing.slice(index + 1)]
      : [...existing, next]

  saveAdminHunts(userId, all)
  return all
}

export function getPlaySessions(): PlaySession[] {
  if (!isBrowser()) return []
  const raw = window.localStorage.getItem(PLAY_SESSIONS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as PlaySession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePlaySessions(sessions: PlaySession[]): void {
  if (!isBrowser()) return
  window.localStorage.setItem(PLAY_SESSIONS_KEY, JSON.stringify(sessions))
}

export function upsertPlaySession(session: PlaySession): PlaySession[] {
  const all = getPlaySessions()
  const index = all.findIndex((s) => s.id === session.id)
  const next =
    index >= 0
      ? [...all.slice(0, index), session, ...all.slice(index + 1)]
      : [...all, session]
  savePlaySessions(next)
  return next
}

