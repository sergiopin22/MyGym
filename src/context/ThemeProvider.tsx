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
  type FocusAccentId,
  type UiLayoutId,
} from '../ui/layoutMode'
import { scheduleCloudSync } from '../sync/autoSync'

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
  const [focusAccent, setFocusAccentState] = useState<FocusAccentId>(() =>
    getStoredFocusAccent(),
  )

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: (id: ThemeId) => {
        applyTheme(id)
        applyFocusAccent(focusAccent)
        setThemeIdState(id)
        scheduleCloudSync({ delayMs: 2500 })
      },
      uiLayout: 'focus' as const,
      setUiLayout: (_id: UiLayoutId) => {
        applyUiLayout('focus', focusAccent)
        scheduleCloudSync({ delayMs: 2500 })
      },
      focusAccent,
      setFocusAccent: (id: FocusAccentId) => {
        setFocusAccentState(id)
        applyFocusAccent(id)
        scheduleCloudSync({ delayMs: 2500 })
      },
    }),
    [themeId, focusAccent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}

export { THEMES, FOCUS_ACCENTS }
