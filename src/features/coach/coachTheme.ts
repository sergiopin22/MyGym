import { THEME_MAP } from '../../themes/presets'
import { applyUiLayout } from '../../ui/applyUiLayout'
import { getStoredFocusAccent, getStoredUiLayout } from '../../ui/layoutMode'

const COACH_THEME = THEME_MAP['underground-red']

/** Paleta exclusiva de la vista coach. No guarda el tema del usuario. */
export function applyCoachViewSkin() {
  const root = document.documentElement
  root.dataset.coachView = '1'
  root.dataset.theme = 'underground-red'
  root.dataset.uiLayout = 'classic'
  delete root.dataset.focusAccent

  for (const [key, value] of Object.entries(COACH_THEME.vars)) {
    root.style.setProperty(key, value)
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', COACH_THEME.metaColor)
}

export function clearCoachViewSkin() {
  const root = document.documentElement
  delete root.dataset.coachView
  applyUiLayout(getStoredUiLayout(), getStoredFocusAccent())
}
