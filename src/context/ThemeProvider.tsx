import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyTheme, getStoredThemeId } from '../themes/applyTheme'
import { THEMES, type ThemeId } from '../themes/presets'
import { applyFocusAccent, applyUiLayout } from '../ui/applyUiLayout'
import {
  FOCUS_ACCENTS,
  getStoredFocusAccent,
  getStoredUiLayout,
  type FocusAccentId,
  type UiLayoutId,
} from '../ui/layoutMode'

interface ThemeContextValue {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
  uiLayout: UiLayoutId
  setUiLayout: (id: UiLayoutId) => void
  focusAccent: FocusAccentId
  setFocusAccent: (id: FocusAccentId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => getStoredThemeId())
  const [uiLayout, setUiLayoutState] = useState<UiLayoutId>(() =>
    getStoredUiLayout(),
  )
  const [focusAccent, setFocusAccentState] = useState<FocusAccentId>(() =>
    getStoredFocusAccent(),
  )

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: (id: ThemeId) => {
        if (uiLayout === 'focus') {
          // En Focus la paleta propia manda; igual guardamos preferencia clásica
          applyTheme(id)
          applyFocusAccent(focusAccent)
        } else {
          applyTheme(id)
        }
        setThemeIdState(id)
      },
      uiLayout,
      setUiLayout: (id: UiLayoutId) => {
        applyUiLayout(id, focusAccent)
        setUiLayoutState(id)
      },
      focusAccent,
      setFocusAccent: (id: FocusAccentId) => {
        setFocusAccentState(id)
        if (uiLayout === 'focus') {
          applyFocusAccent(id)
        } else {
          try {
            localStorage.setItem('mi-gym-focus-accent', id)
          } catch {
            /* ignore */
          }
        }
      },
    }),
    [themeId, uiLayout, focusAccent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}

export { THEMES, FOCUS_ACCENTS }
