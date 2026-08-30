import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { NumberStepper } from '../../components/NumberStepper'
import {
  getSessionById,
  saveCompletedSessionEdits,
} from '../../db/repository'
import type { ExerciseLog, SetLog, WorkoutSession } from '../../types'
import { WEIGHT_STEP, WEIGHT_UNIT } from '../../utils/weight'
import { getIncompleteWorkoutParts } from '../../utils/workout'
import { StrapsToggle } from '../../components/StrapsToggle'
import { supportsStrapsTracking } from '../../utils/straps'

function cloneExercises(exercises: ExerciseLog[]): ExerciseLog[] {
  return exercises.map((ex) => ({
    ...ex,
    targetReps: { ...ex.targetReps },
    sets: ex.sets.map((s) => ({ ...s })),
  }))
}

function setHasData(set: Pick<SetLog, 'weight' | 'reps'>) {
  return set.weight != null && set.reps != null
}

export function EditCompletedSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [original, setOriginal] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
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
        setOriginal(s)
        setExercises(cloneExercises(s.exercises))
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

  const sorted = useMemo(
    () => [...exercises].sort((a, b) => a.order - b.order),
    [exercises],
  )

  function patchSet(
    exerciseId: string,
    setId: string,
    patch: Partial<Pick<SetLog, 'weight' | 'reps' | 'rir' | 'completed' | 'withStraps'>>,
  ) {
    setError(null)
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex
        const sets = ex.sets.map((s) => {
          if (s.id !== setId) return s
          const next = { ...s, ...patch }
          if (patch.completed === true && !setHasData(next)) {
            return s
          }
          return next
        })
        return { ...ex, sets }
      }),
    )
  }

  async function handleSave() {
    if (!sessionId || !original) return
    const draftSession = { ...original, exercises }
    const leftover = getIncompleteWorkoutParts(draftSession)
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
      await saveCompletedSessionEdits(sessionId, exercises)
      navigate(`/historial/${sessionId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-8">
        <p className="text-muted">Cargando sesión…</p>
      </div>
    )
  }

  if (!original) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 pt-8">
        <p className="text-danger">{error ?? 'Sesión no encontrada'}</p>
        <Link to="/historial" className="font-semibold text-brand underline">
          Volver al historial
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="shrink-0 space-y-2 border-b border-line py-3">
        <Link
          to={`/historial/${original.id}`}
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          ← Cancelar
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Editar entrenamiento
        </h1>
        <p className="text-sm text-muted">{original.dayLabel}</p>
        <p className="rounded-2xl bg-brand-soft px-3 py-2 text-xs text-fg">
          Solo puedes corregir peso, reps y RIR. No cambia el día ni la meta de
          constancia. Al guardar, el historial y los PR se actualizan.
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
        {sorted.map((exercise) => {
          const showStraps = supportsStrapsTracking(
            exercise.name,
            original.muscleGroups,
          )
          return (
          <article
            key={exercise.id}
            className="space-y-3 rounded-3xl border border-line bg-surface-elevated p-4"
          >
            <h2 className="font-display text-lg font-bold">{exercise.name}</h2>
            <ul className="space-y-4">
              {[...exercise.sets]
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((set) => (
                  <li key={set.id} className="space-y-2 rounded-2xl bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-muted">
                        Serie {set.setNumber}
                        {set.completed ? ' · completada' : ''}
                      </p>
                      {showStraps ? (
                        <StrapsToggle
                          active={Boolean(set.withStraps)}
                          onToggle={() =>
                            patchSet(exercise.id, set.id, {
                              withStraps: !set.withStraps,
                            })
                          }
                        />
                      ) : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <NumberStepper
                        label={`Peso (${WEIGHT_UNIT})`}
                        step={WEIGHT_STEP}
                        min={0}
                        value={set.weight}
                        onChange={(weight) =>
                          patchSet(exercise.id, set.id, { weight })
                        }
                      />
                      <NumberStepper
                        label="Reps"
                        step={1}
                        min={0}
                        value={set.reps}
                        onChange={(reps) =>
                          patchSet(exercise.id, set.id, { reps })
                        }
                      />
                      <NumberStepper
                        label="RIR"
                        step={1}
                        min={0}
                        max={10}
                        value={set.rir}
                        onChange={(rir) =>
                          patchSet(exercise.id, set.id, { rir })
                        }
                      />
                    </div>
                    <Button
                      fullWidth
                      variant={set.completed ? 'ghost' : 'secondary'}
                      disabled={!set.completed && !setHasData(set)}
                      onClick={() =>
                        patchSet(exercise.id, set.id, {
                          completed: !set.completed,
                        })
                      }
                    >
                      {set.completed
                        ? 'Desmarcar serie'
                        : setHasData(set)
                          ? 'Marcar serie completada'
                          : 'Coloca peso y reps'}
                    </Button>
                  </li>
                ))}
            </ul>
          </article>
          )
        })}
      </div>

      {error ? (
        <p className="pb-2 text-sm font-medium text-danger">{error}</p>
      ) : null}

      <div className="shrink-0 space-y-2 border-t border-line pt-3">
        <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button
          fullWidth
          variant="ghost"
          disabled={saving}
          onClick={() => navigate(`/historial/${original.id}`)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
