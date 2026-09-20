const NAME_KEY = 'mi-gym-display-name'
const CHOSEN_KEY = 'mi-gym-display-name-chosen'

function nameKey(userId?: string | null) {
  return userId ? `${NAME_KEY}:${userId}` : NAME_KEY
}

function chosenKey(userId?: string | null) {
  return userId ? `${CHOSEN_KEY}:${userId}` : CHOSEN_KEY
}

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 40)
}

export function getStoredDisplayName(userId?: string | null): string {
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

export function hasChosenDisplayName(userId?: string | null): boolean {
  try {
    if (userId && localStorage.getItem(chosenKey(userId)) === '1') return true
    if (!userId && localStorage.getItem(CHOSEN_KEY) === '1') return true
    return Boolean(getStoredDisplayName(userId))
  } catch {
    return false
  }
}

export function setStoredDisplayName(
  name: string,
  userId?: string | null,
): string {
  const next = normalizeDisplayName(name)
  try {
    localStorage.setItem(nameKey(userId), next)
    localStorage.setItem(chosenKey(userId), next ? '1' : '0')
    if (!userId) {
      localStorage.setItem(NAME_KEY, next)
      localStorage.setItem(CHOSEN_KEY, next ? '1' : '0')
    }
  } catch {
    /* ignore */
  }
  return next
}

export function needsDisplayName(userId?: string | null): boolean {
  return !getStoredDisplayName(userId)
}
