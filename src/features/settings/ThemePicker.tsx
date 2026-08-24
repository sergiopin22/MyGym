import { Card } from '../../components/Card'
import { useTheme } from '../../context/ThemeProvider'
import { THEMES, type ThemeId } from '../../themes/presets'

export function ThemePicker() {
  const { themeId, setThemeId } = useTheme()

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Temas visuales</h2>
        <p className="mt-1 text-sm text-muted">
          Cambia el look de la app cuando quieras — underground, dark o clásico.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const active = theme.id === themeId
          return (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => setThemeId(theme.id as ThemeId)}
                className={[
                  'w-full rounded-2xl border p-3 text-left transition active:scale-[0.99]',
                  active
                    ? 'border-brand ring-2 ring-brand/30 bg-brand-soft/30'
                    : 'border-line bg-surface hover:border-brand/40',
                ].join(' ')}
              >
                <div className="mb-2 flex gap-1">
                  {theme.swatch.map((color) => (
                    <span
                      key={color}
                      className="h-6 flex-1 rounded-lg ring-1 ring-line"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="font-display font-bold text-fg">{theme.name}</p>
                <p className="text-xs text-muted">{theme.tagline}</p>
                {active ? (
                  <p className="mt-1 text-xs font-semibold text-brand">Activo</p>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
