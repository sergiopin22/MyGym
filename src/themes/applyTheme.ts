import {
  DEFAULT_THEME_ID,
  isThemeId,
  THEME_MAP,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './presets'

export function getStoredThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && isThemeId(saved)) return saved
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_ID
}

export function applyTheme(id: ThemeId) {
  const theme = THEME_MAP[id] ?? THEME_MAP[DEFAULT_THEME_ID]
  const root = document.documentElement

  root.dataset.theme = id

  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme.metaColor)

  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(getStoredThemeId())
}
