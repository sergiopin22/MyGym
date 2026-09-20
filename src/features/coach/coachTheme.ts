import { applyUiLayout } from '../../ui/applyUiLayout'
import {
  FOCUS_ACCENTS,
  getStoredFocusAccent,
  getStoredUiLayout,
} from '../../ui/layoutMode'

const COACH_FOCUS = FOCUS_ACCENTS.dark

/** Paleta exclusiva de la vista coach (Focus Dark). No guarda el tema del usuario. */
export function applyCoachViewSkin() {
  const root = document.documentElement
  root.dataset.coachView = '1'
  root.dataset.uiLayout = 'focus'
  root.dataset.focusAccent = 'dark'
  delete root.dataset.theme

  for (const [key, value] of Object.entries(COACH_FOCUS.vars)) {
    root.style.setProperty(key, value)
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', COACH_FOCUS.metaColor)
}

export function clearCoachViewSkin() {
  const root = document.documentElement
  delete root.dataset.coachView
  applyUiLayout(getStoredUiLayout(), getStoredFocusAccent())
}
