import { normalizeDisplayName } from './displayName'

const NAME_KEY = 'mi-gym-coach-name'

function nameKey(userId?: string | null) {
  return userId ? `${NAME_KEY}:${userId}` : NAME_KEY
}

export function getStoredCoachName(userId?: string | null): string {
  try {
    if (userId) {
      const scoped = localStorage.getItem(nameKey(userId))
      if (scoped?.trim()) return normalizeDisplayName(scoped)
    }
    const legacy = localStorage.getItem(NAME_KEY)
    if (legacy?.trim()) return normalizeDisplayName(legacy)
  } catch {
    /* ignore */
  }
  return ''
}

export function setStoredCoachName(
  name: string,
  userId?: string | null,
): string {
  const next = normalizeDisplayName(name)
  try {
    localStorage.setItem(nameKey(userId), next)
    if (!userId) localStorage.setItem(NAME_KEY, next)
  } catch {
    /* ignore */
  }
  return next
}
