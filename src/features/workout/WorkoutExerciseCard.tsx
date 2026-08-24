import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { NumberStepper } from '../../components/NumberStepper'
import { StatusBadge } from '../../components/StatusBadge'
import {
  applyPreviousWeights,
  getLastExercisePerformance,
  getRecentImprovements,
  updateSet,
} from '../../db/repository'
import type {
  ExerciseLog,
  Improvement,
  LastExercisePerformance,
  WorkoutSession,
} from '../../types'
import { openTutorial } from '../exercises/media'

interface WorkoutExerciseCardProps {
  session: WorkoutSession
  exercise: ExerciseLog
  onSessionChange: (session: WorkoutSession) => void
}

export function WorkoutExerciseCard({
  session,
  exercise,
  onSessionChange,
}: WorkoutExerciseCardProps) {
  const [expandedLast, setExpandedLast] = useState(false)
  const [last, setLast] = useState<LastExercisePerformance | null | undefined>(undefined)
  const [loadingLast, setLoadingLast] = useState(false)
  const [toast, setToast] = useState<Improvement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  async function loadLast() {
    setLoadingLast(true)
    try {
      const perf = await getLastExercisePerformance(exercise.name, session.id)
      setLast(perf ?? null)
    } finally {
      setLoadingLast(false)
    }
  }

  async function toggleLast() {
    const next = !expandedLast
    setExpandedLast(next)
    if (next && last === undefined) await loadLast()
  }

  async function patchSet(
    setId: string,
    patch: Partial<{ weight: number | null; reps: number | null; rir: number | null; completed: boolean }>,
  ) {
    setError(null)
    const prevStatus = exercise.status
    const updated = await updateSet(session.id, exercise.id, setId, patch)
    onSessionChange(updated)

    const nextEx = updated.exercises.find((e) => e.id === exercise.id)
    if (prevStatus !== 'completed' && nextEx?.status === 'completed') {
      const improvements = await getRecentImprovements(5)
      const hit = improvements.find(
        (i) => i.sessionId === session.id && i.routineExerciseId === exercise.routineExerciseId,
      )
      if (hit) setToast(hit)
    }
  }

  async function usePreviousWeight() {
    setBusy(true)
    setError(null)
    try {
      const updated = await applyPreviousWeights(session.id, exercise.id)
      onSessionChange(updated)
      if (last === undefined) await loadLast()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sin historial previo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="space-y-3 rounded-3xl border border-line bg-surface-elevated p-4 shadow-[0_10px_30px_-20px_rgba(12,26,20,0.45)]">
      <div className="flex gap-3">
        <ExerciseThumb
          routineExerciseId={exercise.routineExerciseId}
          name={exercise.name}
          imageUrl={exercise.imageUrl}
          hasCustomImage={exercise.hasCustomImage}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="font-display text-lg font-bold leading-tight">{exercise.name}</h2>
            <StatusBadge status={exercise.status} />
          </div>
          <p className="text-sm text-muted">
            Meta: {exercise.targetSets}×{exercise.targetReps.min}–{exercise.targetReps.max} · RIR{' '}
            {exercise.targetRir}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {exercise.videoUrl ? (
          <Button variant="ghost" className="min-h-11 px-3 text-sm" onClick={() => openTutorial(exercise.videoUrl)}>
            Ver tutorial
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="min-h-11 px-3 text-sm"
          onClick={() => void toggleLast()}
        >
          {expandedLast ? 'Ocultar última vez' : 'Ver última vez'}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 px-3 text-sm"
          disabled={busy}
          onClick={() => void usePreviousWeight()}
        >
          Usar peso anterior
        </Button>
      </div>

      {expandedLast ? (
        <div className="rounded-2xl bg-surface px-3 py-3 text-sm">
          {loadingLast ? (
            <p className="text-muted">Buscando…</p>
          ) : last ? (
            <div className="space-y-2">
              <p className="font-semibold text-ink">
                {new Date(last.date + 'T12:00:00').toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              <ul className="space-y-1">
                {last.sets.map((s) => (
                  <li key={s.setNumber} className="flex justify-between text-muted">
                    <span>Serie {s.setNumber}</span>
                    <span className="font-medium text-ink">
                      {s.weight ?? '—'} kg · {s.reps ?? '—'} reps · RIR {s.rir ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted">Todavía no hay historial de este ejercicio.</p>
          )}
        </div>
      ) : null}

      {toast ? (
        <p className="rounded-2xl bg-[#dcfce7] px-3 py-3 text-sm font-medium text-accent-strong">
          {toast.message}
        </p>
      ) : null}

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      <ul className="space-y-4">
        {exercise.sets.map((set) => (
          <li
            key={set.id}
            className={[
              'space-y-3 rounded-2xl border p-3',
              set.completed ? 'border-accent/40 bg-[#dcfce7]/60' : 'border-line bg-surface',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <p className="font-display font-bold">Serie {set.setNumber}</p>
              {set.completed ? (
                <span className="text-sm font-semibold text-accent-strong">Completada</span>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <NumberStepper
                label="Peso"
                suffix="kg"
                step={2.5}
                min={0}
                value={set.weight}
                disabled={session.status !== 'in_progress'}
                onChange={(weight) => void patchSet(set.id, { weight })}
              />
              <NumberStepper
                label="Reps"
                step={1}
                min={0}
                value={set.reps}
                disabled={session.status !== 'in_progress'}
                onChange={(reps) => void patchSet(set.id, { reps })}
              />
              <NumberStepper
                label="RIR"
                step={1}
                min={0}
                max={10}
                value={set.rir}
                disabled={session.status !== 'in_progress'}
                onChange={(rir) => void patchSet(set.id, { rir })}
              />
            </div>

            {session.status === 'in_progress' ? (
              <Button
                fullWidth
                variant={set.completed ? 'ghost' : 'primary'}
                onClick={() => void patchSet(set.id, { completed: !set.completed })}
              >
                {set.completed ? 'Desmarcar serie' : 'Marcar serie completada'}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  )
}
