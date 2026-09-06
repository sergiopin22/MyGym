import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { useTheme } from '../../context/ThemeProvider'
import {
  getFeaturedExercisePRs,
  getRoutineExercisePRs,
  type ExercisePR,
} from '../../db/repository'
import { formatStrapsLabel } from '../../utils/straps'

function formatPrDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrLine(pr: ExercisePR): string {
  const rir = pr.rir != null ? ` · RIR ${pr.rir}` : ' · RIR —'
  return `${pr.weight} lb × ${pr.reps}${rir}`
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
      title="PR principal"
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

function PrRow({
  title,
  subtitle,
  pr,
  prWithStraps,
  supportsStraps = false,
  showTrophy = false,
}: {
  title: string
  subtitle?: string
  pr: ExercisePR | null
  prWithStraps?: ExercisePR | null
  supportsStraps?: boolean
  showTrophy?: boolean
}) {
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
                  <span className="font-bold text-fg">{formatPrLine(pr)}</span>
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
                    {formatPrLine(prWithStraps)}
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
            <span className="font-bold text-fg">{formatPrLine(pr)}</span>
            <span className="text-muted"> · {formatPrDate(pr.date)}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Aún sin marca registrada</p>
        )}
      </div>
      {showTrophy && (pr || prWithStraps) ? <GoldenTrophy /> : null}
    </li>
  )
}

type FeaturedRow = {
  label: string
  pr: ExercisePR | null
  prWithStraps: ExercisePR | null
  supportsStraps: boolean
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
  row: FeaturedRow
  index: number
  ceiling: number
}) {
  const best = pickBestPr(row.pr, row.prWithStraps)
  const pct = best ? signalPct(best.weight, ceiling) : 8

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
        Corte {String(index + 1).padStart(2, '0')}
      </p>

      {best ? (
        <span className="focus-pr-bill__ghost" aria-hidden>
          {best.weight}
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
        <h3 className="focus-pr-bill__name">{row.label}</h3>

        {row.supportsStraps ? (
          <div className="focus-pr-bill__split">
            <div>
              <span>{formatStrapsLabel(false)}</span>
              <strong>
                {row.pr ? `${row.pr.weight} lb × ${row.pr.reps}` : 'Sin marca'}
              </strong>
              {row.pr ? <em>{formatPrDate(row.pr.date)}</em> : null}
            </div>
            <div>
              <span>{formatStrapsLabel(true)}</span>
              <strong>
                {row.prWithStraps
                  ? `${row.prWithStraps.weight} lb × ${row.prWithStraps.reps}`
                  : 'Sin marca'}
              </strong>
              {row.prWithStraps ? (
                <em>{formatPrDate(row.prWithStraps.date)}</em>
              ) : null}
            </div>
          </div>
        ) : best ? (
          <p className="focus-pr-bill__meta">
            <strong>{best.weight} lb</strong>
            <span>
              × {best.reps}
              {best.rir != null ? ` · RIR ${best.rir}` : ''}
            </span>
            <span>{formatPrDate(best.date)}</span>
          </p>
        ) : (
          <p className="focus-pr-bill__meta">Aún sin exposición</p>
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
  const [tab, setTab] = useState<'featured' | 'all'>('featured')
  const [featured, setFeatured] = useState<FeaturedRow[]>([])
  const [routineRows, setRoutineRows] = useState<
    Array<{
      exerciseName: string
      dayLabels: string[]
      pr: ExercisePR | null
      prWithStraps: ExercisePR | null
      supportsStraps: boolean
    }>
  >([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!active) return
    let alive = true
    setLoading(true)
    Promise.all([getFeaturedExercisePRs(), getRoutineExercisePRs()])
      .then(([f, rows]) => {
        if (!alive) return
        setFeatured(f)
        setRoutineRows(rows)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [active])

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return routineRows
    return routineRows.filter((row) =>
      row.exerciseName.toLowerCase().includes(q),
    )
  }, [routineRows, query])

  const billCeiling = useMemo(() => {
    let peak = 0
    for (const row of featured) {
      const pr = pickBestPr(row.pr, row.prWithStraps)
      if (pr && pr.weight > peak) peak = pr.weight
    }
    return peak || 1
  }, [featured])

  if (isFocus) {
    return (
      <div className="focus-pr-reel">
        <aside className="focus-pr-reel__spine" aria-hidden>
          <span>MARCAS</span>
        </aside>

        <div className="focus-pr-reel__main">
          <header className="focus-pr-reel__chrome">
            <div className="focus-pr-reel__modes" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'featured'}
                className={[
                  'focus-pr-reel__mode',
                  tab === 'featured' ? 'focus-pr-reel__mode--on' : '',
                ].join(' ')}
                onClick={() => setTab('featured')}
              >
                Cartelera
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'all'}
                className={[
                  'focus-pr-reel__mode',
                  tab === 'all' ? 'focus-pr-reel__mode--on' : '',
                ].join(' ')}
                onClick={() => setTab('all')}
              >
                Guion
              </button>
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
            {tab === 'featured'
              ? 'Un corte por ejercicio. Desliza el rollo.'
              : 'Todas las máquinas, línea a línea.'}
          </p>

          <div className="focus-pr-reel__body">
            {loading ? (
              <p className="focus-pr-reel__loading">Revelando el rollo…</p>
            ) : tab === 'featured' ? (
              <div className="focus-pr-reel__track" aria-label="Cartelera de PRs">
                {featured.map((row, index) => (
                  <FocusBillboard
                    key={row.label}
                    row={row}
                    index={index}
                    ceiling={billCeiling}
                  />
                ))}
              </div>
            ) : (
              <div className="focus-pr-script">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar escena…"
                  className="focus-pr-script__search input-ios-safe"
                />

                {filteredAll.length === 0 ? (
                  <p className="focus-pr-reel__loading">
                    {routineRows.length === 0
                      ? 'No hay ejercicios en tu rutina. Agrégalos en Rutinas.'
                      : 'Ninguna escena con ese nombre.'}
                  </p>
                ) : (
                  <ol className="focus-pr-script__list">
                    {filteredAll.map((row, index) => {
                      const best = pickBestPr(row.pr, row.prWithStraps)
                      return (
                        <li
                          key={row.exerciseName}
                          className="focus-pr-script__shot"
                          style={{ animationDelay: `${28 + index * 24}ms` }}
                        >
                          <span className="focus-pr-script__num">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="focus-pr-script__block">
                            <p className="focus-pr-script__title">
                              {row.exerciseName}
                            </p>
                            {row.dayLabels.length ? (
                              <p className="focus-pr-script__days">
                                {row.dayLabels.join(' · ')}
                              </p>
                            ) : null}
                            {row.supportsStraps ? (
                              <div className="focus-pr-script__dual">
                                <span>
                                  {formatStrapsLabel(false)} ·{' '}
                                  {row.pr ? formatPrLine(row.pr) : '—'}
                                </span>
                                <span>
                                  {formatStrapsLabel(true)} ·{' '}
                                  {row.prWithStraps
                                    ? formatPrLine(row.prWithStraps)
                                    : '—'}
                                </span>
                              </div>
                            ) : (
                              <p className="focus-pr-script__line">
                                {best
                                  ? `${formatPrLine(best)} · ${formatPrDate(best.date)}`
                                  : 'Sin marca'}
                              </p>
                            )}
                          </div>
                          <span className="focus-pr-script__weight">
                            {best ? (
                              <>
                                {best.weight}
                                <small>lb</small>
                              </>
                            ) : (
                              '—'
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}
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
          <h2 className="font-display text-xl font-extrabold text-fg">Tus PR</h2>
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

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab('featured')}
          className={[
            'min-h-11 rounded-xl text-sm font-semibold ring-1',
            tab === 'featured'
              ? 'bg-chrome text-chrome-fg ring-chrome'
              : 'bg-surface text-muted ring-line',
          ].join(' ')}
        >
          Principales
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={[
            'min-h-11 rounded-xl text-sm font-semibold ring-1',
            tab === 'all'
              ? 'bg-chrome text-chrome-fg ring-chrome'
              : 'bg-surface text-muted ring-line',
          ].join(' ')}
        >
          Cualquier máquina
        </button>
      </div>

      {tab === 'all' ? (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en tu rutina…"
          className="mb-3 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Cargando…</p>
        ) : tab === 'featured' ? (
          <ul className="space-y-2">
            {featured.map((row) => (
              <PrRow
                key={row.label}
                title={row.label}
                pr={row.pr}
                prWithStraps={row.prWithStraps}
                supportsStraps={row.supportsStraps}
                showTrophy
              />
            ))}
          </ul>
        ) : filteredAll.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {routineRows.length === 0
              ? 'No hay ejercicios en tu rutina. Agrégalos en Rutinas.'
              : 'No hay máquinas con ese nombre.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredAll.map((row) => (
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
