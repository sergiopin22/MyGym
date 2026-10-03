import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import {
  deleteExerciseEverywhere,
  getRoutineExercisePRs,
  type ExercisePR,
} from '../../db/repository'
import { scheduleCloudSync } from '../../sync/autoSync'
import { muscleMatchesFilter, MUSCLE_FILTERS } from '../../utils/muscleFilter'
import { formatStrapsLabel } from '../../utils/straps'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import { formatWeightPair } from '../../utils/weight'
import {
  ExerciseStatsPanel,
  type ExerciseStatsTarget,
} from './ExerciseStatsPanel'

function formatPrDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

function MuscleFilterChips({
  value,
  onChange,
  focus,
}: {
  value: string | null
  onChange: (next: string | null) => void
  focus?: boolean
}) {
  return (
    <div
      className={
        focus ? 'focus-pr-reel__muscles' : 'mb-3 flex flex-wrap gap-2'
      }
      role="group"
      aria-label="Filtrar por músculo"
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className={
          focus
            ? [
                'pr-stats__chip',
                value === null ? 'pr-stats__chip--on' : '',
              ].join(' ')
            : [
                'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
                value === null
                  ? 'bg-chrome text-chrome-fg'
                  : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
              ].join(' ')
        }
      >
        Todos
      </button>
      {MUSCLE_FILTERS.map((group) => {
        const active = value === group.id
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onChange(active ? null : group.id)}
            className={
              focus
                ? ['pr-stats__chip', active ? 'pr-stats__chip--on' : ''].join(
                    ' ',
                  )
                : [
                    'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
                    active
                      ? 'bg-chrome text-chrome-fg'
                      : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
                  ].join(' ')
            }
          >
            {group.label}
          </button>
        )
      })}
    </div>
  )
}

function emptyPrMessage(
  rowCount: number,
  query: string,
  muscleFilter: string | null,
): string {
  if (rowCount === 0) {
    return 'No hay ejercicios en tu rutina. Agrégalos en Rutinas.'
  }
  if (muscleFilter || query.trim()) {
    return 'Ningún ejercicio con ese filtro.'
  }
  return 'Ningún ejercicio con ese nombre.'
}

type RoutinePrRow = {
  exerciseName: string
  baseName: string
  machineId?: string
  gripName?: string
  dayLabels: string[]
  muscleGroups: string[]
  pr: ExercisePR | null
  prWithStraps: ExercisePR | null
  supportsStraps: boolean
}

function toStatsTarget(row: RoutinePrRow): ExerciseStatsTarget {
  return {
    baseName: row.baseName,
    machineId: row.machineId,
    gripName: row.gripName,
    displayName: row.exerciseName,
    supportsStraps: row.supportsStraps,
    initialWithStraps: row.supportsStraps,
  }
}

function signalPct(weight: number, ceiling: number): number {
  if (!ceiling || weight <= 0) return 8
  return Math.max(10, Math.min(100, Math.round((weight / ceiling) * 100)))
}

function FocusBillboard({
  row,
  index,
  ceiling,
  onOpenStats,
  onDelete,
}: {
  row: RoutinePrRow
  index: number
  ceiling: number
  onOpenStats: () => void
  onDelete: () => void
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

        <div className="focus-pr-bill__actions">
          <button
            type="button"
            className="focus-pr-bill__stats"
            onClick={onOpenStats}
          >
            Ver estadística
          </button>
          <button
            type="button"
            className="focus-pr-bill__merge"
            onClick={onDelete}
          >
            Eliminar
          </button>
        </div>
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
  const [rows, setRows] = useState<RoutinePrRow[]>([])
  const [query, setQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsTarget, setStatsTarget] = useState<ExerciseStatsTarget | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<RoutinePrRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!active) {
      setStatsTarget(null)
      setDeleteTarget(null)
      return
    }
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
  }, [active, reloadKey])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteExerciseEverywhere(deleteTarget.baseName)
      scheduleCloudSync({ delayMs: 800 })
      setDeleteTarget(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (q && !row.exerciseName.toLowerCase().includes(q)) return false
      return muscleMatchesFilter(row.muscleGroups, muscleFilter)
    })
  }, [rows, query, muscleFilter])

  const billCeiling = useMemo(() => {
    let peak = 0
    for (const row of filtered) {
      const pr = pickBestPr(row.pr, row.prWithStraps)
      if (pr && pr.weight > peak) peak = pr.weight
    }
    return peak || 1
  }, [filtered])

  if (statsTarget) {
    return (
      <ExerciseStatsPanel
        target={statsTarget}
        onClose={() => setStatsTarget(null)}
      />
    )
  }

  const deleteOverlay =
    deleteTarget != null ? (
      <div className="pr-merge" role="dialog" aria-label="Eliminar máquina">
        <div className="pr-merge__card">
          <p className="pr-merge__kicker">Eliminar máquina</p>
          <h3 className="pr-merge__title">
            ¿Borrar “{deleteTarget.baseName}”?
          </h3>
          <p className="pr-merge__hint">
            Se quita de la rutina y se borra su historial (series y PR de ese
            nombre). La otra máquina con nombre distinto no se toca.
          </p>
          {deleteError ? (
            <p className="pr-merge__error">{deleteError}</p>
          ) : null}
          <div className="pr-merge__list">
            <Button
              fullWidth
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              disabled={deleting}
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    ) : null

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
            Todas las máquinas de tu rutina. Abre la estadística de cada una.
          </p>

          <div className="focus-pr-reel__toolbar">
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="focus-pr-reel__search input-ios-safe"
              aria-label="Buscar ejercicio"
            />

            <MuscleFilterChips
              focus
              value={muscleFilter}
              onChange={setMuscleFilter}
            />
          </div>

          <div className="focus-pr-reel__body">
            {loading ? (
              <p className="focus-pr-reel__loading">Cargando PRs…</p>
            ) : filtered.length === 0 ? (
              <p className="focus-pr-reel__loading">
                {emptyPrMessage(rows.length, query, muscleFilter)}
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
                    onOpenStats={() => setStatsTarget(toStatsTarget(row))}
                    onDelete={() => {
                      setDeleteError(null)
                      setDeleteTarget(row)
                    }}
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
        {deleteOverlay}
      </div>
    )
}
