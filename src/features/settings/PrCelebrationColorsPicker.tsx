import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import {
  PR_CELEBRATION_PRESETS,
  buttonForeground,
  normalizeHex,
  patchPrCelebrationColor,
  prCelebrationCssVars,
  selectPrCelebrationPreset,
  usePrCelebrationColors,
  type PrCelebrationPalette,
  type PrCelebrationPresetId,
} from '../workout/prCelebrationColors'

function HexField({
  value,
  dark,
  onCommit,
}: {
  value: string
  dark: boolean
  onCommit: (hex: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <input
      type="text"
      spellCheck={false}
      value={draft}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        const hex = normalizeHex(next)
        if (hex) onCommit(hex)
      }}
      onBlur={() => setDraft(value)}
      className={[
        'w-[6.6rem] rounded-lg px-2 py-1.5 font-mono text-sm uppercase ring-1',
        dark ? 'bg-black text-white ring-white/20' : 'bg-surface text-fg ring-line',
      ].join(' ')}
    />
  )
}

const COLOR_ROWS: Array<{
  key: keyof PrCelebrationPalette
  label: string
  hint: string
}> = [
  { key: 'kicker', label: 'Subtítulo', hint: 'LÍMITE ROTO' },
  { key: 'title', label: 'Título', hint: '¡Rompiste el límite!' },
  { key: 'nums', label: 'Números', hint: '225 lb × 8' },
  { key: 'button', label: 'Botón Seguir', hint: 'El botón de abajo' },
]

interface PrCelebrationColorsPickerProps {
  dark?: boolean
}

export function PrCelebrationColorsPicker({
  dark = false,
}: PrCelebrationColorsPickerProps) {
  const colors = usePrCelebrationColors()
  const vars = prCelebrationCssVars(colors)
  const btnFg = buttonForeground(colors.button)
  const muted = dark ? 'text-white/70' : 'text-muted'
  const labelCls = dark ? 'text-white' : 'text-fg'
  const rowRing = dark ? 'ring-white/20' : 'ring-line'

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`font-display text-lg font-bold ${labelCls}`}>
          Colores del PR
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Elige una paleta o arma la tuya. Por defecto es Clover (rojo, negro y
          blanco).
        </p>
      </div>

      <div
        className="rounded-2xl bg-black px-4 py-4 text-center ring-1 ring-white/15"
        style={vars}
      >
        <p
          className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.32em]"
          style={{ color: 'var(--pr-kicker)' }}
        >
          Límite roto
        </p>
        <p
          className="mt-1 font-display text-[1.45rem] font-extrabold uppercase leading-none"
          style={{ color: 'var(--pr-title)' }}
        >
          ¡Rompiste el límite!
        </p>
        <p
          className="mt-3 font-display text-[1.85rem] font-extrabold leading-none"
          style={{ color: 'var(--pr-nums)' }}
        >
          225
          <span className="ml-1 text-sm font-bold tracking-wide opacity-75">
            LB
          </span>
          <span className="mx-1" style={{ color: 'var(--pr-accent)' }}>
            ×
          </span>
          8
          <span className="ml-1 text-sm font-bold tracking-wide opacity-75">
            REPS
          </span>
        </p>
        <p
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl text-sm font-extrabold uppercase tracking-wide"
          style={{ background: 'var(--pr-btn)', color: btnFg }}
        >
          Seguir
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(PR_CELEBRATION_PRESETS) as Array<
          Exclude<PrCelebrationPresetId, 'custom'>
        >).map((id) => {
          const preset = PR_CELEBRATION_PRESETS[id]
          const active = colors.preset === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => selectPrCelebrationPreset(id)}
                className={[
                  'w-full rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99]',
                  active
                    ? dark
                      ? 'bg-white/10 ring-white'
                      : 'bg-brand-soft/30 ring-brand'
                    : dark
                      ? 'bg-white/5 ring-white/20'
                      : 'bg-surface ring-line hover:border-brand/40',
                ].join(' ')}
              >
                <span className="mb-2 flex gap-1">
                  <span
                    className="h-6 flex-1 rounded-lg ring-1 ring-white/20"
                    style={{ background: preset.colors.kicker }}
                  />
                  <span
                    className="h-6 flex-1 rounded-lg ring-1 ring-white/20"
                    style={{ background: preset.colors.title }}
                  />
                  <span
                    className="h-6 flex-1 rounded-lg ring-1 ring-white/20"
                    style={{ background: preset.colors.button }}
                  />
                </span>
                <span className={`block font-display font-bold ${labelCls}`}>
                  {preset.name}
                </span>
                <span className={`block text-xs ${muted}`}>{preset.tagline}</span>
                {active ? (
                  <span
                    className="mt-1 block text-xs font-semibold"
                    style={{ color: dark ? '#fff' : undefined }}
                  >
                    Activo
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {colors.preset === 'custom' ? (
        <p className={`text-xs font-semibold ${muted}`}>Tus colores</p>
      ) : (
        <p className={`text-xs ${muted}`}>
          Toca un color para pasar a personalizado.
        </p>
      )}

      <div className="space-y-2">
        {COLOR_ROWS.map((row) => (
          <label
            key={row.key}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2 ring-1 ${rowRing}`}
          >
            <input
              type="color"
              value={colors[row.key]}
              aria-label={row.label}
              onChange={(e) => patchPrCelebrationColor(row.key, e.target.value)}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
            />
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${labelCls}`}>
                {row.label}
              </span>
              <span className={`block text-xs ${muted}`}>{row.hint}</span>
            </span>
            <HexField
              key={`${row.key}-${colors[row.key]}`}
              value={colors[row.key]}
              dark={dark}
              onCommit={(hex) => patchPrCelebrationColor(row.key, hex)}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export function PrCelebrationColorsSettings() {
  return (
    <Card className="space-y-4">
      <PrCelebrationColorsPicker />
    </Card>
  )
}
