import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { useTheme } from '../../context/ThemeProvider'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import {
  getExerciseProgressHistory,
  type ExerciseProgressRange,
  type ExerciseProgressStats,
} from '../../db/repository'
import { formatStrapsLabel } from '../../utils/straps'
import { formatWeightPair } from '../../utils/weight'
import { WeightProgressChart } from './WeightProgressChart'

function formatPrDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const RANGES: Array<{ id: ExerciseProgressRange; label: string }> = [
  { id: '1m', label: '1 mes' },
  { id: '3m', label: '3 meses' },
  { id: 'all', label: 'Todo' },
]

function trendLabel(trend: ExerciseProgressStats['trend']): string {
  if (trend === 'up') return 'Subiendo'
  if (trend === 'down') return 'Bajando'
  if (trend === 'flat') return 'Estable'
  return 'Sin tendencia'
}

export interface ExerciseStatsTarget {
  baseName: string
  gripName?: string
  displayName: string
  supportsStraps: boolean
  initialWithStraps?: boolean
}

interface ExerciseStatsPanelProps {
  target: ExerciseStatsTarget
  onClose: () => void
}

export function ExerciseStatsPanel({ target, onClose }: ExerciseStatsPanelProps) {
  const { uiLayout } = useTheme()
  const { unit, toDisplay, label } = useWeightUnit()
  const isFocus = uiLayout === 'focus'
  const [range, setRange] = useState<ExerciseProgressRange>('3m')
  const [withStraps, setWithStraps] = useState(Boolean(target.initialWithStraps))
  const [stats, setStats] = useState<ExerciseProgressStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setWithStraps(Boolean(target.initialWithStraps))
  }, [target.baseName, target.gripName, target.initialWithStraps])

  useEffect(() => {
    let alive = true
    setLoading(true)
    getExerciseProgressHistory({
      baseName: target.baseName,
      gripName: target.gripName,
      withStraps,
      range,
    })
      .then((data) => {
        if (!alive) return
        setStats(data)
        setSelected(data.points.length ? data.points.length - 1 : null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [target.baseName, target.gripName, withStraps, range])

  const point =
    stats && selected != null ? (stats.points[selected] ?? null) : null

  const deltaDisplay =
    stats?.deltaWeight != null ? toDisplay(stats.deltaWeight) : null

  const body = (
    <>
      <header className={isFocus ? 'pr-stats__chrome' : 'mb-3'}>
        <div className="min-w-0 flex-1">
          <p className={isFocus ? 'pr-stats__kicker' : 'text-xs font-semibold uppercase tracking-wide text-muted'}>
            Estadística
          </p>
          <h2
            className={
              isFocus
                ? 'pr-stats__title'
                : 'font-display text-xl font-extrabold text-fg'
            }
          >
            {target.displayName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={
            isFocus
              ? 'focus-pr-reel__close'
              : 'rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg'
          }
        >
          Cerrar
        </button>
      </header>

      <div className={isFocus ? 'pr-stats__filters' : 'mb-3 flex flex-wrap gap-2'}>
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={[
              isFocus ? 'pr-stats__chip' : 'rounded-xl px-3 py-2 text-sm font-semibold ring-1',
              range === r.id
                ? isFocus
                  ? 'pr-stats__chip--on'
                  : 'bg-chrome text-chrome-fg ring-chrome'
                : isFocus
                  ? ''
                  : 'bg-surface text-muted ring-line',
            ].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {target.supportsStraps ? (
        <div className={isFocus ? 'pr-stats__filters' : 'mb-3 flex flex-wrap gap-2'}>
          {[false, true].map((mode) => (
            <button
              key={String(mode)}
              type="button"
              onClick={() => setWithStraps(mode)}
              className={[
                isFocus ? 'pr-stats__chip' : 'rounded-xl px-3 py-2 text-sm font-semibold ring-1',
                withStraps === mode
                  ? isFocus
                    ? 'pr-stats__chip--on'
                    : 'bg-chrome text-chrome-fg ring-chrome'
                  : isFocus
                    ? ''
                    : 'bg-surface text-muted ring-line',
              ].join(' ')}
            >
              {formatStrapsLabel(mode)}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className={isFocus ? 'pr-stats__empty' : 'py-8 text-center text-sm text-muted'}>
          Cargando historial…
        </p>
      ) : !stats || stats.points.length === 0 ? (
        <p className={isFocus ? 'pr-stats__empty' : 'py-8 text-center text-sm text-muted'}>
          Aún no hay historial en esta máquina
          {target.supportsStraps ? ` (${formatStrapsLabel(withStraps)})` : ''}.
        </p>
      ) : (
        <>
          <div className={isFocus ? 'pr-stats__summary' : 'mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4'}>
            <div className={isFocus ? 'pr-stats__stat' : 'rounded-2xl bg-surface px-3 py-2 ring-1 ring-line'}>
              <span className={isFocus ? 'pr-stats__stat-label' : 'block text-xs text-muted'}>
                PR actual
              </span>
              <strong className={isFocus ? 'pr-stats__stat-value' : 'block text-sm font-bold text-fg'}>
                {stats.currentPr
                  ? formatWeightPair(
                      stats.currentPr.weight,
                      stats.currentPr.reps,
                      unit,
                    )
                  : '—'}
              </strong>
            </div>
            <div className={isFocus ? 'pr-stats__stat' : 'rounded-2xl bg-surface px-3 py-2 ring-1 ring-line'}>
              <span className={isFocus ? 'pr-stats__stat-label' : 'block text-xs text-muted'}>
                Desde el 1.º
              </span>
              <strong className={isFocus ? 'pr-stats__stat-value' : 'block text-sm font-bold text-fg'}>
                {deltaDisplay == null
                  ? '—'
                  : `${deltaDisplay >= 0 ? '+' : ''}${deltaDisplay} ${label}`}
              </strong>
            </div>
            <div className={isFocus ? 'pr-stats__stat' : 'rounded-2xl bg-surface px-3 py-2 ring-1 ring-line'}>
              <span className={isFocus ? 'pr-stats__stat-label' : 'block text-xs text-muted'}>
                Sesiones
              </span>
              <strong className={isFocus ? 'pr-stats__stat-value' : 'block text-sm font-bold text-fg'}>
                {stats.sessionsCount}
              </strong>
            </div>
            <div className={isFocus ? 'pr-stats__stat' : 'rounded-2xl bg-surface px-3 py-2 ring-1 ring-line'}>
              <span className={isFocus ? 'pr-stats__stat-label' : 'block text-xs text-muted'}>
                Tendencia
              </span>
              <strong className={isFocus ? 'pr-stats__stat-value' : 'block text-sm font-bold text-fg'}>
                {trendLabel(stats.trend)}
              </strong>
            </div>
          </div>

          <WeightProgressChart
            points={stats.points}
            selectedIndex={selected}
            onSelect={setSelected}
          />

          {point ? (
            <div className={isFocus ? 'pr-stats__detail' : 'mt-3 rounded-2xl bg-surface px-3 py-3 ring-1 ring-line'}>
              <p className={isFocus ? 'pr-stats__detail-date' : 'text-xs font-semibold text-muted'}>
                {formatPrDate(point.date)}
                {point.isRunningPr ? ' · Nuevo PR' : ''}
              </p>
              <p className={isFocus ? 'pr-stats__detail-line' : 'mt-1 text-sm font-bold text-fg'}>
                {formatWeightPair(point.weight, point.reps, unit)}
                {point.rir != null ? ` · RIR ${point.rir}` : ''}
              </p>
            </div>
          ) : null}
        </>
      )}

      <div className={isFocus ? 'pr-stats__footer' : 'mt-3'}>
        <Button fullWidth variant={isFocus ? 'primary' : 'secondary'} onClick={onClose}>
          Volver a PR
        </Button>
      </div>
    </>
  )

  if (isFocus) {
    return (
      <div className="pr-stats pr-stats--focus" role="dialog" aria-label="Estadística de ejercicio">
        {body}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" role="dialog">
      {body}
    </div>
  )
}
