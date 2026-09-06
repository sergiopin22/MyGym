import { Card } from '../../components/Card'
import { useTheme, FOCUS_ACCENTS, THEMES } from '../../context/ThemeProvider'
import { type ThemeId } from '../../themes/presets'
import type { FocusAccentId, UiLayoutId } from '../../ui/layoutMode'

export function ThemePicker() {
  const {
    themeId,
    setThemeId,
    uiLayout,
    setUiLayout,
    focusAccent,
    setFocusAccent,
  } = useTheme()

  const layouts: Array<{ id: UiLayoutId; name: string; tagline: string }> = [
    {
      id: 'classic',
      name: 'Clásico',
      tagline: 'La interfaz actual: menú abajo y temas Ippo/Temach…',
    },
    {
      id: 'focus',
      name: 'Focus',
      tagline: 'Diseño nuevo: FAB flotante, paleta propia verde/naranja',
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">Diseño de la app</h2>
          <p className="mt-1 text-sm text-muted">
            Cambia entre la interfaz clásica y Focus. Puedes volver cuando quieras.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {layouts.map((layout) => {
            const active = uiLayout === layout.id
            return (
              <li key={layout.id}>
                <button
                  type="button"
                  onClick={() => setUiLayout(layout.id)}
                  className={[
                    'w-full rounded-2xl border p-3 text-left transition active:scale-[0.99]',
                    active
                      ? 'border-brand ring-2 ring-brand/30 bg-brand-soft/30'
                      : 'border-line bg-surface hover:border-brand/40',
                  ].join(' ')}
                >
                  <p className="font-display font-bold text-fg">{layout.name}</p>
                  <p className="text-xs text-muted">{layout.tagline}</p>
                  {active ? (
                    <p className="mt-1 text-xs font-semibold text-brand">Activo</p>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      {uiLayout === 'focus' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold">Acento Focus</h2>
            <p className="mt-1 text-sm text-muted">
              Paleta propia de Focus. Cambia verde ↔ naranja cuando quieras.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(FOCUS_ACCENTS) as FocusAccentId[]).map((id) => {
              const accent = FOCUS_ACCENTS[id]
              const active = focusAccent === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setFocusAccent(id)}
                    className={[
                      'w-full rounded-2xl border p-3 text-left transition active:scale-[0.99]',
                      active
                        ? 'border-brand ring-2 ring-brand/30 bg-brand-soft/30'
                        : 'border-line bg-surface hover:border-brand/40',
                    ].join(' ')}
                  >
                    <div className="mb-2 flex gap-1">
                      {accent.swatch.map((color) => (
                        <span
                          key={color}
                          className="h-6 flex-1 rounded-lg ring-1 ring-line"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="font-display font-bold text-fg">{accent.name}</p>
                    <p className="text-xs text-muted">{accent.tagline}</p>
                    {active ? (
                      <p className="mt-1 text-xs font-semibold text-brand">Activo</p>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold">Temas visuales</h2>
            <p className="mt-1 text-sm text-muted">
              Underground, Temach, Ippo, Asta, dark o clásico — elige tu vibe.
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
      )}
    </div>
  )
}
