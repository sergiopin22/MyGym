import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/Card'
import { StatusBadge } from '../../components/StatusBadge'
import { getExerciseHistory, getHistory, getSessionDetail } from '../../db/repository'
import type { SessionSummary, WorkoutSession } from '../../types'
import { formatDuration } from '../../utils/id'
import { CopyCoachMessageButton } from './CopyCoachMessageButton'

export function HistoryPage() {
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

  if (loading) return <p className="pt-8 text-muted">Cargando historial…</p>

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Historial</h1>
        <p className="mt-1 text-muted">
          Entrenamientos guardados. Copia el resumen para enviarlo a tu coach.
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            Aún no hay sesiones completadas. Finaliza un entrenamiento para verlo aquí.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.sessionId}>
              <Card className="space-y-3">
                <Link to={`/historial/${item.sessionId}`} className="block">
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
      )}
    </div>
  )
}

export function HistoryDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [exerciseName, setExerciseName] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (!sessionId) return
    getSessionDetail(sessionId)
      .then((s) => {
        if (alive) setSession(s ?? null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [sessionId])

  if (loading) return <p className="pt-8 text-muted">Cargando…</p>
  if (!session) {
    return (
      <div className="space-y-3 pt-8">
        <p className="text-danger">Sesión no encontrada</p>
        <Link to="/historial" className="font-semibold text-brand underline">
          Volver
        </Link>
      </div>
    )
  }

  if (exerciseName) {
    return (
      <ExerciseHistoryView
        name={exerciseName}
        onBack={() => setExerciseName(null)}
      />
    )
  }

  const exercises = [...session.exercises].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-5">
      <header className="space-y-2 pt-2">
        <Link
          to="/historial"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
        >
          ← Historial
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {session.dayLabel}
        </h1>
        <p className="text-muted">
          {new Date(session.date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          {session.durationMs != null ? ` · ${formatDuration(session.durationMs)}` : ''}
        </p>
      </header>

      <CopyCoachMessageButton session={session} fullWidth />

      <ul className="space-y-3">
        {exercises.map((ex) => (
          <li key={ex.id}>
            <Card className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold">{ex.name}</h2>
                  <StatusBadge status={ex.status} />
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-brand"
                  onClick={() => setExerciseName(ex.name)}
                >
                  Ver historial
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                {ex.sets.map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between rounded-xl bg-surface px-3 py-2 text-muted"
                  >
                    <span>Serie {s.setNumber}{s.completed ? '' : ' (no)'}</span>
                    <span className="font-medium text-ink">
                      {s.weight ?? '—'} kg · {s.reps ?? '—'} · RIR {s.rir ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
              {ex.note ? (
                <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-fg">
                  <span className="font-semibold">Nota: </span>
                  {ex.note}
                </p>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExerciseHistoryView({
  name,
  onBack,
}: {
  name: string
  onBack: () => void
}) {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof getExerciseHistory>>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getExerciseHistory(name)
      .then((data) => {
        if (alive) setRows(data)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [name])

  return (
    <div className="space-y-5">
      <header className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
        >
          ← Volver al detalle
        </button>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{name}</h1>
        <p className="text-muted">Historial individual del ejercicio</p>
      </header>

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Sin registros previos.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.sessionId}>
              <Card className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {new Date(row.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-muted">{row.dayLabel}</p>
                <ul className="space-y-1 text-sm">
                  {row.sets.map((s) => (
                    <li key={s.id} className="flex justify-between text-muted">
                      <span>S{s.setNumber}</span>
                      <span className="text-ink">
                        {s.weight ?? '—'} kg · {s.reps ?? '—'} · RIR {s.rir ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
