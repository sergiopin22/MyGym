import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import { completeSession, getSessionById } from '../../db/repository'
import type { SessionSummary, WorkoutSession } from '../../types'
import { formatDuration } from '../../utils/id'
import { CopyCoachMessageButton } from '../history/CopyCoachMessageButton'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'

export function WorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    let alive = true
    if (!sessionId) return
    getSessionById(sessionId)
      .then((s) => {
        if (!alive) return
        if (!s) {
          setError('Sesión no encontrada')
          return
        }
        setSession(s)
        if (s.status === 'completed') {
          setSummary({
            sessionId: s.id,
            date: s.date,
            dayLabel: s.dayLabel,
            durationMs: s.durationMs ?? 0,
            completedExercises: s.exercises.filter((e) => e.status === 'completed').length,
            totalExercises: s.exercises.length,
            totalSetsCompleted: s.exercises.reduce(
              (acc, e) => acc + e.sets.filter((x) => x.completed).length,
              0,
            ),
            muscleGroups: s.muscleGroups,
          })
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Error al cargar')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [sessionId])

  const exercises = useMemo(
    () =>
      session
        ? [...session.exercises].sort((a, b) => a.order - b.order)
        : [],
    [session],
  )

  const completedCount = exercises.filter((e) => e.status === 'completed').length

  async function handleFinish() {
    if (!session) return
    const ok = window.confirm('¿Finalizar entrenamiento y guardarlo en el historial?')
    if (!ok) return
    setFinishing(true)
    setError(null)
    try {
      const result = await completeSession(session.id)
      setSession(result.session)
      setSummary(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo finalizar')
    } finally {
      setFinishing(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg px-4 pt-8">
        <p className="text-muted">Cargando entrenamiento…</p>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg space-y-4 px-4 pt-8">
        <p className="text-danger">{error}</p>
        <Link to="/" className="font-semibold text-brand underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  if (!session) return null

  if (summary && session.status === 'completed') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="space-y-1 pt-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            Entrenamiento guardado
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Resumen</h1>
          <p className="text-muted">{summary.dayLabel}</p>
        </header>

        <Card className="mt-6 space-y-4">
          <Stat label="Duración" value={formatDuration(summary.durationMs)} />
          <Stat
            label="Ejercicios"
            value={`${summary.completedExercises} de ${summary.totalExercises}`}
          />
          <Stat label="Series completadas" value={String(summary.totalSetsCompleted)} />
          {summary.muscleGroups.length ? (
            <p className="text-sm text-muted">{summary.muscleGroups.join(' · ')}</p>
          ) : null}
        </Card>

        <CopyCoachMessageButton session={session} fullWidth className="mt-4" />

        <ul className="mt-5 space-y-2">
          {exercises.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between rounded-2xl bg-surface-elevated px-3 py-3 text-sm ring-1 ring-line"
            >
              <span className="font-medium">{ex.name}</span>
              <span>
                {ex.status === 'completed'
                  ? '✅'
                  : ex.sets.some((s) => s.completed)
                    ? '🟡'
                    : '⏳'}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-2 pt-8">
          <Button fullWidth onClick={() => navigate('/historial')}>
            Ver historial
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to="/" className="text-sm font-semibold text-muted hover:text-ink">
              ← Inicio
            </Link>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {session.dayLabel}
            </h1>
            <p className="text-sm text-muted">
              {completedCount} de {exercises.length} ejercicios completados
            </p>
          </div>
        </div>
        <ProgressBar value={completedCount} max={Math.max(exercises.length, 1)} />
      </header>

      <div className="mt-4 space-y-4">
        {exercises.map((exercise) => (
          <WorkoutExerciseCard
            key={exercise.id}
            session={session}
            exercise={exercise}
            onSessionChange={setSession}
          />
        ))}
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      <div className="mt-6 space-y-2">
        <Button fullWidth onClick={() => void handleFinish()} disabled={finishing}>
          {finishing ? 'Guardando…' : 'Finalizar entrenamiento'}
        </Button>
        <p className="text-center text-xs text-muted">
          Se guarda en el historial. Puedes cerrar la app y continuar después.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display text-xl font-bold">{value}</span>
    </div>
  )
}
