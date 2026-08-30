import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ProgressBar } from '../../components/ProgressBar'
import {
  getSessionById,
  saveCompletedSessionEdits,
} from '../../db/repository'
import type { WorkoutSession } from '../../types'
import { getIncompleteWorkoutParts } from '../../utils/workout'
import { supportsStrapsTracking } from '../../utils/straps'
import { WorkoutExerciseCard } from '../workout/WorkoutExerciseCard'

function cloneSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    muscleGroups: [...session.muscleGroups],
    exercises: session.exercises.map((ex) => ({
      ...ex,
      targetReps: { ...ex.targetReps },
      sets: ex.sets.map((s) => ({ ...s })),
    })),
  }
}

export function EditCompletedSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        if (s.status !== 'completed') {
          setError('Solo se pueden editar entrenamientos ya completados.')
          return
        }
        setDraft(cloneSession(s))
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Error al cargar')
        }
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
      draft ? [...draft.exercises].sort((a, b) => a.order - b.order) : [],
    [draft],
  )

  const completedCount = exercises.filter((e) => e.status === 'completed').length

  const hasBackStrapsExercises = draft
    ? exercises.some((ex) =>
        supportsStrapsTracking(ex.name, draft.muscleGroups),
      )
    : false

  function setStrapsForAllBack(withStraps: boolean) {
    if (!draft) return
    setError(null)
    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) => {
        if (!supportsStrapsTracking(ex.name, draft.muscleGroups)) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            withStraps: withStraps || undefined,
          })),
        }
      }),
    })
  }

  async function handleSave() {
    if (!sessionId || !draft) return
    const leftover = getIncompleteWorkoutParts(draft)
    if (leftover.incompleteSets > 0) {
      const preview = leftover.details.slice(0, 4).join('\n')
      setError(
        `Completa todas las series antes de guardar. Faltan ${leftover.incompleteSets}.`,
      )
      window.alert(
        `Completa peso y reps en todas las series (o desmárcalas).\n\n${preview}`,
      )
      return
    }

    const ok = window.confirm(
      '¿Guardar cambios?\n\nSe actualizará el historial y los PR si cambian. La meta de constancia no se modifica.',
    )
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      await saveCompletedSessionEdits(sessionId, draft.exercises)
      navigate(`/historial/${sessionId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg px-4 pt-8">
        <p className="text-muted">Cargando sesión…</p>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg space-y-3 px-4 pt-8">
        <p className="text-danger">{error ?? 'Sesión no encontrada'}</p>
        <Link to="/historial" className="font-semibold text-brand underline">
          Volver al historial
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="shrink-0 space-y-3 border-b border-line py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/historial/${draft.id}`}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              ← Cancelar
            </Link>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              Editar · {draft.dayLabel}
            </h1>
            {draft.isRecovery ? (
              <span className="mt-1 inline-flex rounded-full bg-progress-soft px-2.5 py-1 text-xs font-bold text-progress">
                Recuperado
                {draft.recoveredDayLabel
                  ? ` · ${draft.recoveredDayLabel}`
                  : ''}
              </span>
            ) : null}
            <p className="text-sm text-muted">
              {completedCount} de {exercises.length} ejercicios · misma vista
              que el entrenamiento
            </p>
          </div>
        </div>
        <ProgressBar
          value={completedCount}
          max={Math.max(exercises.length, 1)}
        />
        <p className="rounded-2xl bg-brand-soft px-3 py-2 text-xs text-fg">
          Corrige peso, reps, RIR y straps. No cambia el día ni la meta. Los PR
          se actualizan al guardar.
        </p>
        {hasBackStrapsExercises ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-10 px-3 text-sm"
              disabled={saving}
              onClick={() => setStrapsForAllBack(true)}
            >
              Marcar espalda con straps
            </Button>
            <Button
              variant="ghost"
              className="min-h-10 px-3 text-sm"
              disabled={saving}
              onClick={() => setStrapsForAllBack(false)}
            >
              Quitar straps en espalda
            </Button>
          </div>
        ) : null}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <WorkoutExerciseCard
              key={exercise.id}
              session={draft}
              exercise={exercise}
              editMode
              onSessionChange={setDraft}
            />
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-danger">{error}</p>
        ) : null}

        <div className="mt-6 space-y-2">
          <Button
            fullWidth
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button
            fullWidth
            variant="ghost"
            disabled={saving}
            onClick={() => navigate(`/historial/${draft.id}`)}
          >
            Cancelar
          </Button>
          <p className="text-center text-xs text-muted">
            Los cambios no se guardan hasta que pulses Guardar.
          </p>
        </div>
      </div>
    </div>
  )
}
