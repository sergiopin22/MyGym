import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, getStoredThemeId } from '../themes/applyTheme'
import { THEMES, type ThemeId } from '../themes/presets'

interface ThemeContextValue {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => getStoredThemeId())

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: (id: ThemeId) => {
        applyTheme(id)
        setThemeIdState(id)
      },
    }),
    [themeId],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}

export { THEMES }
