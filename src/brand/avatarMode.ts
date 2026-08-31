export type AvatarMode = 'preset' | 'custom'

export const AVATAR_MODE_STORAGE_KEY = 'mi-gym-avatar-mode'

export function getStoredAvatarMode(): AvatarMode {
  try {
    const raw = localStorage.getItem(AVATAR_MODE_STORAGE_KEY)
    if (raw === 'custom' || raw === 'preset') return raw
  } catch {
    /* ignore */
  }
  return 'preset'
}

export function setStoredAvatarMode(mode: AvatarMode): void {
  try {
    localStorage.setItem(AVATAR_MODE_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export function isAvatarMode(value: string): value is AvatarMode {
  return value === 'preset' || value === 'custom'
}
