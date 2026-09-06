import { useEffect, useState } from 'react'
import {
  getGymHeatmapData,
  type GymHeatmapData,
} from '../../db/repository'

const YDAY_LABELS = ['', 'Ma', '', 'Ju', '', 'Sá', '']
/** Semanas visibles: caben en el ancho del celular sin scroll, tiles legibles */
const HEAT_WEEKS = 22

interface FocusGymHeatmapProps {
  refreshKey?: number
}

export function FocusGymHeatmap({ refreshKey = 0 }: FocusGymHeatmapProps) {
  const [data, setData] = useState<GymHeatmapData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setError(null)
    void getGymHeatmapData({ weekCount: HEAT_WEEKS })
      .then((next) => {
        if (alive) setData(next)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setData(null)
        setError(
          err instanceof Error ? err.message : 'No se pudo leer el historial',
        )
      })
    return () => {
      alive = false
    }
  }, [refreshKey])

  if (error) {
    return (
      <section className="focus-heat">
        <p className="focus-heat__empty">{error}</p>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="focus-heat focus-heat--loading" aria-hidden>
        <div className="focus-heat__skeleton" />
      </section>
    )
  }

  const weeksVar = { ['--heat-weeks' as string]: String(data.weeks.length) }

  return (
    <section className="focus-heat" aria-label="Consistencia en el gym">
      <header className="focus-heat__head">
        <div className="focus-heat__identity">
          <span className="focus-heat__icon" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M4.5 12h3l2-5 3 10 2-5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="focus-heat__title">Gym</h2>
            <p className="focus-heat__sub">
              {data.totalGymDays > 0
                ? `${data.totalGymDays} día${data.totalGymDays === 1 ? '' : 's'} con gym · historial`
                : 'Ir al gym'}
            </p>
          </div>
        </div>
        <span
          className={[
            'focus-heat__check',
            data.doneToday ? 'focus-heat__check--on' : '',
          ].join(' ')}
          aria-label={data.doneToday ? 'Hoy ya entrenaste' : 'Hoy pendiente'}
          title={data.doneToday ? 'Hoy ya entrenaste' : 'Hoy pendiente'}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M5 12.5 10 17.5 19 7.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </header>

      <div className="focus-heat__months-row">
        <span className="focus-heat__months-gutter" aria-hidden />
        <div className="focus-heat__months" style={weeksVar}>
          {data.weeks.map((_, weekIndex) => {
            const label = data.monthLabels.find((m) => m.weekIndex === weekIndex)
            return (
              <span key={weekIndex} className="focus-heat__month">
                {label?.label ?? ''}
              </span>
            )
          })}
        </div>
      </div>

      <div className="focus-heat__body">
        <div className="focus-heat__ydays" aria-hidden>
          {YDAY_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className="focus-heat__grid" style={weeksVar}>
          {data.weeks.map((week) =>
            week.map((cell) => (
              <span
                key={cell.date}
                className={[
                  'focus-heat__cell',
                  cell.done ? 'focus-heat__cell--on' : '',
                  cell.isToday ? 'focus-heat__cell--today' : '',
                  cell.isFuture ? 'focus-heat__cell--future' : '',
                ].join(' ')}
                title={
                  cell.isFuture
                    ? cell.date
                    : cell.done
                      ? `${cell.date} · Gym`
                      : `${cell.date} · Sin gym`
                }
              />
            )),
          )}
        </div>
      </div>

      {data.totalGymDays === 0 ? (
        <p className="focus-heat__empty">
          Aún no hay días encendidos. Al finalizar entrenos del historial, se
          llenan solos.
        </p>
      ) : null}

      <footer className="focus-heat__stats">
        <span className="focus-heat__pill">
          <span aria-hidden>🔥</span>
          {data.streak}
        </span>
        <span className="focus-heat__pill">
          <span aria-hidden>◎</span>
          {data.weekCount} / {data.weekTarget} Semana
        </span>
      </footer>
    </section>
  )
}
