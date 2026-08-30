import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
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
  const [tab, setTab] = useState<'featured' | 'all'>('featured')
  const [featured, setFeatured] = useState<
    Array<{
      label: string
      pr: ExercisePR | null
      prWithStraps: ExercisePR | null
      supportsStraps: boolean
    }>
  >([])
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
