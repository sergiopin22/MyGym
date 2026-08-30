import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { getHistory } from '../../db/repository'
import type { SessionSummary } from '../../types'
import { formatDuration } from '../../utils/id'
import { CopyCoachMessageButton } from './CopyCoachMessageButton'

interface HistoryListProps {
  onNavigate?: () => void
}

export function HistoryList({ onNavigate }: HistoryListProps) {
  const [items, setItems] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getHistory()
      .then((rows) => {
        if (alive) setItems(rows)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <p className="py-6 text-center text-sm text-muted">Cargando historial…</p>

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Aún no hay sesiones completadas. Finaliza un entrenamiento para verlo aquí.
        </p>
      </Card>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.sessionId}>
          <Card className="space-y-3">
            <Link
              to={`/historial/${item.sessionId}`}
              className="block"
              onClick={onNavigate}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <h2 className="font-display text-lg font-bold">{item.dayLabel}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.isRecovery ? (
                      <span className="inline-flex rounded-full bg-progress-soft px-2.5 py-1 text-xs font-bold text-progress">
                        Recuperado
                        {item.recoveredDayLabel ? ` · ${item.recoveredDayLabel}` : ''}
                      </span>
                    ) : null}
                    {item.editedAt ? (
                      <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-fg">
                        Editado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {item.completedExercises}/{item.totalExercises} ejercicios ·{' '}
                    {item.totalSetsCompleted} series · {formatDuration(item.durationMs)}
                  </p>
                </div>
                <span className="text-2xl text-muted" aria-hidden>
                  ›
                </span>
              </div>
            </Link>
            <CopyCoachMessageButton summary={item} fullWidth />
          </Card>
        </li>
      ))}
    </ul>
  )
}
