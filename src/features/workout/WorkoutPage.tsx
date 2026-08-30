import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import {
  completeSession,
  cancelSession,
  getSessionById,
  type SessionNewPR,
} from '../../db/repository'
import type { SessionSummary, WorkoutSession } from '../../types'
import { formatDuration } from '../../utils/id'
import { getIncompleteWorkoutParts } from '../../utils/workout'
import { CopyCoachMessageButton } from '../history/CopyCoachMessageButton'
import { PrTrophyPop } from './PrTrophyPop'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'

export function WorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [newPRs, setNewPRs] = useState<SessionNewPR[]>([])
  const [showPrPop, setShowPrPop] = useState(false)

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
            isRecovery: s.isRecovery,
            recoveredDayLabel: s.recoveredDayLabel,
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

    const leftover = getIncompleteWorkoutParts(session)
    if (leftover.incompleteSets > 0) {
      const preview = leftover.details.slice(0, 4).join('\n')
      const more =
        leftover.details.length > 4
          ? `\n… y ${leftover.details.length - 4} más`
          : ''
      setError(
        `No puedes finalizar todavía. Faltan ${leftover.incompleteSets} serie(s) en ${leftover.incompleteExercises} ejercicio(s).`,
      )
      window.alert(
        `Completa todos los ejercicios y sus series antes de finalizar.\n\n${preview}${more}`,
      )
      return
    }

    const ok = window.confirm('¿Finalizar entrenamiento y guardarlo en el historial?')
    if (!ok) return
    setFinishing(true)
    setError(null)
    try {
      const result = await completeSession(session.id)
      setSession(result.session)
      setSummary(result.summary)
      if (result.newPRs.length > 0) {
        setNewPRs(result.newPRs)
        setShowPrPop(true)
        try {
          if (navigator.vibrate) navigator.vibrate([18, 40, 18])
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo finalizar')
    } finally {
      setFinishing(false)
    }
  }

  async function handleCancel() {
    if (!session) return
    const ok = window.confirm(
      '¿Estás seguro de cancelar este entrenamiento?\n\nSe borrará lo registrado en esta sesión (no quedará en el historial). Úsalo si lo iniciaste por error.',
    )
    if (!ok) return
    setCancelling(true)
    setError(null)
    try {
      await cancelSession(session.id)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar')
    } finally {
      setCancelling(false)
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
      <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden px-4">
        {showPrPop ? (
          <PrTrophyPop prs={newPRs} onClose={() => setShowPrPop(false)} />
        ) : null}

        <header className="shrink-0 space-y-1 border-b border-line py-3 pt-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            Entrenamiento guardado
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Resumen</h1>
          <p className="text-muted">{summary.dayLabel}</p>
          {summary.isRecovery ? (
            <span className="inline-flex rounded-full bg-progress-soft px-3 py-1 text-xs font-bold text-progress">
              Recuperado
              {summary.recoveredDayLabel
                ? ` · ${summary.recoveredDayLabel}`
                : ''}
            </span>
          ) : null}
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {newPRs.length > 0 && !showPrPop ? (
            <button
              type="button"
              onClick={() => setShowPrPop(true)}
              className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-left ring-1 ring-line transition active:scale-[0.99]"
            >
              <span className="text-2xl" aria-hidden>
                🏆
              </span>
              <span>
                <span className="block font-display text-base font-bold text-accent-strong">
                  {newPRs.length === 1
                    ? '¡Nuevo PR en esta sesión!'
                    : `¡${newPRs.length} PRs nuevos!`}
                </span>
                <span className="text-xs text-muted">Toca para verlos otra vez</span>
              </span>
            </button>
          ) : null}

          <Card className="space-y-4">
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

          <div className="mt-6 space-y-2">
            <Button fullWidth onClick={() => navigate('/historial')}>
              Ver historial
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden px-4">
      <header className="shrink-0 space-y-3 border-b border-line py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to="/" className="text-sm font-semibold text-muted hover:text-ink">
              ← Inicio
            </Link>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {session.dayLabel}
            </h1>
            {session.isRecovery ? (
              <span className="mt-1 inline-flex rounded-full bg-progress-soft px-2.5 py-1 text-xs font-bold text-progress">
                Recuperado
                {session.recoveredDayLabel
                  ? ` · ${session.recoveredDayLabel}`
                  : ''}
              </span>
            ) : null}
            <p className="text-sm text-muted">
              {completedCount} de {exercises.length} ejercicios completados
            </p>
          </div>
        </div>
        <ProgressBar value={completedCount} max={Math.max(exercises.length, 1)} />
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="space-y-4">
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
        <Button fullWidth onClick={() => void handleFinish()} disabled={finishing || cancelling}>
          {finishing ? 'Guardando…' : 'Finalizar entrenamiento'}
        </Button>
        <Button
          variant="danger"
          fullWidth
          disabled={finishing || cancelling}
          onClick={() => void handleCancel()}
        >
          {cancelling ? 'Cancelando…' : 'Cancelar entrenamiento'}
        </Button>
        <p className="text-center text-xs text-muted">
          Se guarda en el historial al finalizar. Cancela si lo iniciaste por error.
        </p>
      </div>
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
