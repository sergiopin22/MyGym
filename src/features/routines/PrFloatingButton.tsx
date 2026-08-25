import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import {
  getFeaturedExercisePRs,
  getRoutineExercisePRs,
  type ExercisePR,
} from '../../db/repository'

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

function PrRow({
  title,
  subtitle,
  pr,
}: {
  title: string
  subtitle?: string
  pr: ExercisePR | null
}) {
  return (
    <li className="rounded-2xl bg-surface px-3 py-3 ring-1 ring-line">
      <p className="text-sm font-semibold text-fg">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      ) : null}
      {pr ? (
        <p className="mt-1 text-sm text-muted">
          <span className="font-bold text-fg">{formatPrLine(pr)}</span>
          <span className="text-muted"> · {formatPrDate(pr.date)}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Aún sin marca registrada</p>
      )}
    </li>
  )
}

export function PrFloatingButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'featured' | 'all'>('featured')
  const [featured, setFeatured] = useState<
    Array<{ label: string; pr: ExercisePR | null }>
  >([])
  const [routineRows, setRoutineRows] = useState<
    Array<{ exerciseName: string; dayLabels: string[]; pr: ExercisePR | null }>
  >([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
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
  }, [open])

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return routineRows
    return routineRows.filter((row) =>
      row.exerciseName.toLowerCase().includes(q),
    )
  }, [routineRows, query])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg ring-2 ring-line transition active:scale-95"
        style={{
          bottom: 'max(5.75rem, calc(4.75rem + env(safe-area-inset-bottom)))',
        }}
        aria-label="Ver marcas personales (PR)"
      >
        <span className="font-display text-base font-extrabold tracking-wide">
          PR
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Marcas personales"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface-elevated p-4 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-extrabold text-fg">
                  Tus PR
                </h2>
                <p className="text-sm text-muted">
                  Mejor peso × reps · RIR de esa serie
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg"
              >
                Cerrar
              </button>
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
                    <PrRow key={row.label} title={row.label} pr={row.pr} />
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
                        row.dayLabels.length
                          ? row.dayLabels.join(' · ')
                          : undefined
                      }
                      pr={row.pr}
                    />
                  ))}
                </ul>
              )}
            </div>

            <Button
              fullWidth
              variant="secondary"
              className="mt-3"
              onClick={() => setOpen(false)}
            >
              Listo
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
