import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { useTheme } from '../../context/ThemeProvider'
import {
  getRoutineExercisePRs,
  type ExercisePR,
} from '../../db/repository'
import { formatStrapsLabel } from '../../utils/straps'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import type { WeightUnit } from '../../utils/weight'
import { formatWeightPair } from '../../utils/weight'

function formatPrDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrLine(pr: ExercisePR, unit: WeightUnit): string {
  const rir = pr.rir != null ? ` · RIR ${pr.rir}` : ' · RIR —'
  return `${formatWeightPair(pr.weight, pr.reps, unit)}${rir}`
}

function pickBestPr(
  pr: ExercisePR | null,
  prWithStraps: ExercisePR | null,
): ExercisePR | null {
  if (pr && prWithStraps) {
    return pr.weight >= prWithStraps.weight ? pr : prWithStraps
  }
  return pr ?? prWithStraps
}

function GoldenTrophy() {
  return (
    <span
      className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      aria-hidden
      title="PR"
    >
      <span className="absolute inset-0 rounded-full bg-amber-400/25 blur-md" />
      <span
        className="relative text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]"
        style={{ filter: 'saturate(1.35) brightness(1.1)' }}
      >
        🏆
      </span>
    </span>
  )
}

type RoutinePrRow = {
  exerciseName: string
  dayLabels: string[]
  pr: ExercisePR | null
  prWithStraps: ExercisePR | null
  supportsStraps: boolean
}

function PrRow({
  title,
  subtitle,
  pr,
  prWithStraps,
  supportsStraps = false,
}: {
  title: string
  subtitle?: string
  pr: ExercisePR | null
  prWithStraps?: ExercisePR | null
  supportsStraps?: boolean
}) {
  const { unit } = useWeightUnit()
  const hasMark = Boolean(pr || prWithStraps)
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3 ring-1 ring-line">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        ) : null}
        {supportsStraps ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-sm text-muted">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                {formatStrapsLabel(false)}:{' '}
              </span>
              {pr ? (
                <>
                  <span className="font-bold text-fg">{formatPrLine(pr, unit)}</span>
                  <span className="text-muted"> · {formatPrDate(pr.date)}</span>
                </>
              ) : (
                <span className="text-muted">Sin marca</span>
              )}
            </p>
            <p className="text-sm text-muted">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                {formatStrapsLabel(true)}:{' '}
              </span>
              {prWithStraps ? (
                <>
                  <span className="font-bold text-fg">
                    {formatPrLine(prWithStraps, unit)}
                  </span>
                  <span className="text-muted">
                    {' '}
                    · {formatPrDate(prWithStraps.date)}
                  </span>
                </>
              ) : (
                <span className="text-muted">Sin marca</span>
              )}
            </p>
          </div>
        ) : pr ? (
          <p className="mt-1 text-sm text-muted">
            <span className="font-bold text-fg">{formatPrLine(pr, unit)}</span>
            <span className="text-muted"> · {formatPrDate(pr.date)}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Aún sin marca registrada</p>
        )}
      </div>
      {hasMark ? <GoldenTrophy /> : null}
    </li>
  )
}

function signalPct(weight: number, ceiling: number): number {
  if (!ceiling || weight <= 0) return 8
  return Math.max(10, Math.min(100, Math.round((weight / ceiling) * 100)))
}

function FocusBillboard({
  row,
  index,
  ceiling,
}: {
  row: RoutinePrRow
  index: number
  ceiling: number
}) {
  const { unit, toDisplay, label } = useWeightUnit()
  const best = pickBestPr(row.pr, row.prWithStraps)
  const pct = best ? signalPct(best.weight, ceiling) : 8
  const ghost = best ? toDisplay(best.weight) : null

  return (
    <section
      className={[
        'focus-pr-bill',
        best ? 'focus-pr-bill--lit' : 'focus-pr-bill--void',
      ].join(' ')}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="focus-pr-bill__frame" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>

      <p className="focus-pr-bill__cut">
        {String(index + 1).padStart(2, '0')}
      </p>

      {ghost != null ? (
        <span className="focus-pr-bill__ghost" aria-hidden>
          {ghost}
        </span>
      ) : (
        <span className="focus-pr-bill__ghost focus-pr-bill__ghost--dash" aria-hidden>
          —
        </span>
      )}

      <div className="focus-pr-bill__signal" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </div>

      <div className="focus-pr-bill__copy">
        <h3 className="focus-pr-bill__name">{row.exerciseName}</h3>
        {row.dayLabels.length ? (
          <p className="focus-pr-bill__days">{row.dayLabels.join(' · ')}</p>
        ) : null}

        {row.supportsStraps ? (
          <div className="focus-pr-bill__split">
            <div>
              <span>{formatStrapsLabel(false)}</span>
              <strong>
                {row.pr
                  ? formatWeightPair(row.pr.weight, row.pr.reps, unit)
                  : 'Sin marca'}
              </strong>
              {row.pr ? <em>{formatPrDate(row.pr.date)}</em> : null}
            </div>
            <div>
              <span>{formatStrapsLabel(true)}</span>
              <strong>
                {row.prWithStraps
                  ? formatWeightPair(
                      row.prWithStraps.weight,
                      row.prWithStraps.reps,
                      unit,
                    )
                  : 'Sin marca'}
              </strong>
              {row.prWithStraps ? (
                <em>{formatPrDate(row.prWithStraps.date)}</em>
              ) : null}
            </div>
          </div>
        ) : best ? (
          <p className="focus-pr-bill__meta">
            <strong>
              {toDisplay(best.weight)} {label}
            </strong>
            <span>
              × {best.reps}
              {best.rir != null ? ` · RIR ${best.rir}` : ''}
            </span>
            <span>{formatPrDate(best.date)}</span>
          </p>
        ) : (
          <p className="focus-pr-bill__meta">Aún sin marca</p>
        )}
      </div>
    </section>
  )
}

interface PrPanelProps {
  active?: boolean
  onClose?: () => void
  showCloseButton?: boolean
}

export function PrPanel({
  active = true,
  onClose,
  showCloseButton = true,
}: PrPanelProps) {
  const { uiLayout } = useTheme()
  const isFocus = uiLayout === 'focus'
  const [rows, setRows] = useState<RoutinePrRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!active) return
    let alive = true
    setLoading(true)
    getRoutineExercisePRs()
      .then((list) => {
        if (!alive) return
        setRows(list)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [active])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.exerciseName.toLowerCase().includes(q))
  }, [rows, query])

  const billCeiling = useMemo(() => {
    let peak = 0
    for (const row of filtered) {
      const pr = pickBestPr(row.pr, row.prWithStraps)
      if (pr && pr.weight > peak) peak = pr.weight
    }
    return peak || 1
  }, [filtered])

  if (isFocus) {
    return (
      <div className="focus-pr-reel">
        <aside className="focus-pr-reel__spine" aria-hidden>
          <span>PR</span>
        </aside>

        <div className="focus-pr-reel__main">
          <header className="focus-pr-reel__chrome">
            <div className="focus-pr-reel__title-block">
              <p className="focus-pr-reel__title">PR en todos los ejercicios</p>
            </div>
            {showCloseButton && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="focus-pr-reel__close"
              >
                Cerrar
              </button>
            ) : null}
          </header>

          <p className="focus-pr-reel__lede">
            Todas las máquinas de tu rutina. Desliza para ver cada marca.
          </p>

          <div className="focus-pr-reel__body">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="focus-pr-reel__search input-ios-safe"
            />

            {loading ? (
              <p className="focus-pr-reel__loading">Cargando PRs…</p>
            ) : filtered.length === 0 ? (
              <p className="focus-pr-reel__loading">
                {rows.length === 0
                  ? 'No hay ejercicios en tu rutina. Agrégalos en Rutinas.'
                  : 'Ningún ejercicio con ese nombre.'}
              </p>
            ) : (
              <div
                className="focus-pr-reel__track"
                aria-label="PR en todos los ejercicios"
              >
                {filtered.map((row, index) => (
                  <FocusBillboard
                    key={row.exerciseName}
                    row={row}
                    index={index}
                    ceiling={billCeiling}
                  />
                ))}
              </div>
            )}
          </div>

          {onClose ? (
            <div className="focus-pr-reel__footer">
              <Button
                fullWidth
                className="focus-pr-reel__done"
                onClick={onClose}
              >
                Listo
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-extrabold text-fg">
            PR en todos los ejercicios
          </h2>
          <p className="text-sm text-muted">
            Mejor peso × reps · RIR · sin/con straps en espalda
          </p>
        </div>
        {showCloseButton && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg"
          >
            Cerrar
          </button>
        ) : null}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ejercicio…"
        className="mb-3 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {rows.length === 0
              ? 'No hay ejercicios en tu rutina. Agrégalos en Rutinas.'
              : 'Ningún ejercicio con ese nombre.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((row) => (
              <PrRow
                key={row.exerciseName}
                title={row.exerciseName}
                subtitle={
                  row.dayLabels.length ? row.dayLabels.join(' · ') : undefined
                }
                pr={row.pr}
                prWithStraps={row.prWithStraps}
                supportsStraps={row.supportsStraps}
              />
            ))}
          </ul>
        )}
      </div>

      {onClose ? (
        <Button fullWidth variant="secondary" className="mt-3" onClick={onClose}>
          Listo
        </Button>
      ) : null}
    </div>
  )
}
