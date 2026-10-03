import {
  FOCUS_ACCENTS,
  getStoredFocusAccent,
  getStoredUiLayout,
  type FocusAccentId,
  type UiLayoutId,
  FOCUS_ACCENT_STORAGE_KEY,
  UI_LAYOUT_STORAGE_KEY,
} from './layoutMode'

export function applyFocusAccent(accent: FocusAccentId) {
  const preset = FOCUS_ACCENTS[accent]
  const root = document.documentElement
  root.dataset.uiLayout = 'focus'
  root.dataset.focusAccent = accent

  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value)
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', preset.metaColor)

  try {
    localStorage.setItem(FOCUS_ACCENT_STORAGE_KEY, accent)
  } catch {
    /* ignore */
  }
}

export function applyUiLayout(_layout: UiLayoutId, accent = getStoredFocusAccent()) {
  try {
    localStorage.setItem(UI_LAYOUT_STORAGE_KEY, 'focus')
  } catch {
    /* ignore */
  }
  applyFocusAccent(accent)
}

export function initUiLayout() {
  applyUiLayout(getStoredUiLayout(), getStoredFocusAccent())
}
