import { Card } from '../../components/Card'
import { useTheme, FOCUS_ACCENTS } from '../../context/ThemeProvider'
import type { FocusAccentId } from '../../ui/layoutMode'

export function ThemePicker() {
  const { focusAccent, setFocusAccent } = useTheme()

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">Acento Focus</h2>
          <p className="mt-1 text-sm text-muted">
            Lima, Ámbar, Dark, Blue, Red, Violet o Teal. Cambia cuando quieras.
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
    </div>
  )
}
