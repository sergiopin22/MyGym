import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { NumberStepper } from '../../components/NumberStepper'
import { StatusBadge } from '../../components/StatusBadge'
import { StrapsToggle } from '../../components/StrapsToggle'
import {
  applyPreviousWeights,
  getLastExercisePerformance,
  setExerciseStraps,
  updateExerciseNote,
  updateSet,
} from '../../db/repository'
import type {
  ExerciseLog,
  LastExercisePerformance,
  SetLog,
  WorkoutSession,
} from '../../types'
import { openTutorial } from '../exercises/media'
import { WEIGHT_STEP, WEIGHT_UNIT } from '../../utils/weight'
import { supportsStrapsTracking, formatStrapsSuffix } from '../../utils/straps'
import { computeExerciseStatus } from '../../utils/workout'

function setHasData(set: { weight: number | null; reps: number | null }) {
  return set.weight != null && set.reps != null
}

type SetPatch = Partial<{
  weight: number | null
  reps: number | null
  rir: number | null
  completed: boolean
  withStraps: boolean
}>

function applyLocalSetPatch(
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
  patch: SetPatch,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex
    const sets = ex.sets.map((s) => {
      if (s.id !== setId) return s
      const next: SetLog = {
        ...s,
        ...patch,
        withStraps:
          patch.withStraps === undefined
            ? s.withStraps
            : patch.withStraps || undefined,
        completedAt:
          patch.completed === true
            ? Date.now()
            : patch.completed === false
              ? undefined
              : s.completedAt,
      }
      return next
    })
    const status = computeExerciseStatus(sets)
    return {
      ...ex,
      sets,
      status,
      completedAt:
        status === 'completed' && ex.status !== 'completed'
          ? Date.now()
          : ex.completedAt,
    }
  })
  return { ...session, exercises }
}

function applyLocalExerciseStraps(
  session: WorkoutSession,
  exerciseId: string,
  withStraps: boolean,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex
    return {
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        withStraps: withStraps || undefined,
      })),
    }
  })
  return { ...session, exercises }
}

function applyLocalNote(
  session: WorkoutSession,
  exerciseId: string,
  note: string,
): WorkoutSession {
  const trimmed = note.trim()
  return {
    ...session,
    exercises: session.exercises.map((ex) =>
      ex.id === exerciseId
        ? { ...ex, note: trimmed ? trimmed : undefined }
        : ex,
    ),
  }
}

interface WorkoutExerciseCardProps {
  session: WorkoutSession
  exercise: ExerciseLog
  onSessionChange: (session: WorkoutSession) => void
  /** Edición de sesión completada: misma UI, sin escribir a DB hasta Guardar */
  editMode?: boolean
}

export function WorkoutExerciseCard({
  session,
  exercise,
  onSessionChange,
  editMode = false,
}: WorkoutExerciseCardProps) {
  const canEdit = editMode || session.status === 'in_progress'
  const [expandedLast, setExpandedLast] = useState(false)
  const [last, setLast] = useState<LastExercisePerformance | null | undefined>(
    undefined,
  )
  const [loadingLast, setLoadingLast] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState(exercise.note ?? '')
  const [noteOpen, setNoteOpen] = useState(Boolean(exercise.note))

  useEffect(() => {
    setNoteDraft(exercise.note ?? '')
    if (exercise.note) setNoteOpen(true)
  }, [exercise.id, exercise.note])

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

  async function patchSet(setId: string, patch: SetPatch) {
    if (patch.completed === true) {
      const current = exercise.sets.find((s) => s.id === setId)
      if (!current) return
      const nextWeight = patch.weight !== undefined ? patch.weight : current.weight
      const nextReps = patch.reps !== undefined ? patch.reps : current.reps
      if (nextWeight == null || nextReps == null) {
        setError('Coloca peso y reps antes de marcar la serie.')
        return
      }
    }
    setError(null)
    if (editMode) {
      onSessionChange(applyLocalSetPatch(session, exercise.id, setId, patch))
      return
    }
    const updated = await updateSet(session.id, exercise.id, setId, patch)
    onSessionChange(updated)
  }

  async function usePreviousWeight() {
    setBusy(true)
    setError(null)
    try {
      if (editMode) {
        const perf =
          last === undefined
            ? await getLastExercisePerformance(exercise.name, session.id)
            : last
        if (last === undefined) setLast(perf ?? null)
        if (!perf) throw new Error('No hay historial previo para este ejercicio')
        const weights = perf.sets.map((s) => s.weight)
        const straps = perf.sets.map((s) => s.withStraps)
        const exercises = session.exercises.map((ex) => {
          if (ex.id !== exercise.id) return ex
          const sets = ex.sets.map((s, index) => ({
            ...s,
            weight: weights[index] ?? weights[weights.length - 1] ?? null,
            reps: null,
            rir: null,
            withStraps:
              straps[index] ?? straps[straps.length - 1] ?? undefined,
          }))
          return {
            ...ex,
            sets,
            status: computeExerciseStatus(sets),
          }
        })
        onSessionChange({ ...session, exercises })
        return
      }
      const updated = await applyPreviousWeights(session.id, exercise.id)
      onSessionChange(updated)
      if (last === undefined) await loadLast()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sin historial previo')
    } finally {
      setBusy(false)
    }
  }

  async function saveNote() {
    if (!canEdit) return
    const next = noteDraft.trim()
    const current = (exercise.note ?? '').trim()
    if (next === current) return
    setError(null)
    try {
      if (editMode) {
        onSessionChange(applyLocalNote(session, exercise.id, next))
        return
      }
      const updated = await updateExerciseNote(session.id, exercise.id, next)
      onSessionChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota')
    }
  }

  async function setAllStraps(withStraps: boolean) {
    if (!canEdit) return
    setError(null)
    try {
      if (editMode) {
        onSessionChange(
          applyLocalExerciseStraps(session, exercise.id, withStraps),
        )
        return
      }
      const updated = await setExerciseStraps(session.id, exercise.id, withStraps)
      onSessionChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar straps')
    }
  }

  const showStraps = supportsStrapsTracking(exercise.name, session.muscleGroups)

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
            <h2 className="font-display text-lg font-bold leading-tight">
              {exercise.name}
            </h2>
            <StatusBadge status={exercise.status} />
          </div>
          <p className="text-sm text-muted">
            Meta: {exercise.targetSets}×{exercise.targetReps.min}–
            {exercise.targetReps.max} · RIR {exercise.targetRir}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {exercise.videoUrl ? (
          <Button
            variant="ghost"
            className="min-h-11 px-3 text-sm"
            onClick={() => openTutorial(exercise.videoUrl)}
          >
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
        {canEdit ? (
          <Button
            variant="secondary"
            className="min-h-11 px-3 text-sm"
            disabled={busy}
            onClick={() => void usePreviousWeight()}
          >
            Usar peso anterior
          </Button>
        ) : null}
        {showStraps && canEdit ? (
          <>
            <Button
              variant="secondary"
              className="min-h-11 px-3 text-sm"
              onClick={() => void setAllStraps(true)}
            >
              Todas con straps
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 px-3 text-sm"
              onClick={() => void setAllStraps(false)}
            >
              Sin straps
            </Button>
          </>
        ) : null}
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
                  <li
                    key={s.setNumber}
                    className="flex justify-between text-muted"
                  >
                    <span>Serie {s.setNumber}</span>
                    <span className="font-medium text-ink">
                      {s.weight ?? '—'} {WEIGHT_UNIT} · {s.reps ?? '—'} reps ·
                      RIR {s.rir ?? '—'}
                      {formatStrapsSuffix(s.withStraps)}
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

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      {canEdit ? (
        <div className="space-y-2">
          {!noteOpen && !noteDraft ? (
            <Button
              variant="ghost"
              className="min-h-11 px-3 text-sm"
              onClick={() => setNoteOpen(true)}
            >
              Añadir nota (opcional)
            </Button>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Nota para el coach (opcional)
              </span>
              <textarea
                value={noteDraft}
                rows={2}
                maxLength={280}
                placeholder="Ej. me dolió el hombro, se sintió fácil…"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/25"
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={() => void saveNote()}
              />
            </label>
          )}
        </div>
      ) : exercise.note ? (
        <p className="rounded-2xl bg-surface px-3 py-3 text-sm text-fg">
          <span className="font-semibold">Nota: </span>
          {exercise.note}
        </p>
      ) : null}

      <ul className="space-y-4">
        {exercise.sets.map((set) => (
          <li
            key={set.id}
            className={[
              'space-y-3 rounded-2xl border p-3',
              set.completed
                ? 'border-accent/40 bg-success-soft/60'
                : 'border-line bg-surface',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-bold">Serie {set.setNumber}</p>
              <div className="flex items-center gap-2">
                {showStraps && canEdit ? (
                  <StrapsToggle
                    active={Boolean(set.withStraps)}
                    onToggle={() =>
                      void patchSet(set.id, { withStraps: !set.withStraps })
                    }
                  />
                ) : showStraps && set.withStraps ? (
                  <span className="text-xs font-bold uppercase tracking-wide text-brand">
                    Con straps
                  </span>
                ) : null}
                {set.completed ? (
                  <span className="text-sm font-semibold text-accent-strong">
                    Completada
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <NumberStepper
                label="Peso"
                suffix={WEIGHT_UNIT}
                step={WEIGHT_STEP}
                min={0}
                value={set.weight}
                disabled={!canEdit}
                onChange={(weight) => void patchSet(set.id, { weight })}
              />
              <NumberStepper
                label="Reps"
                step={1}
                min={0}
                value={set.reps}
                disabled={!canEdit}
                onChange={(reps) => void patchSet(set.id, { reps })}
              />
              <NumberStepper
                label="RIR"
                step={1}
                min={0}
                max={10}
                value={set.rir}
                disabled={!canEdit}
                onChange={(rir) => void patchSet(set.id, { rir })}
              />
            </div>

            {canEdit ? (
              <Button
                fullWidth
                variant={set.completed ? 'ghost' : 'primary'}
                disabled={!set.completed && !setHasData(set)}
                onClick={() =>
                  void patchSet(set.id, { completed: !set.completed })
                }
              >
                {set.completed
                  ? 'Desmarcar serie'
                  : setHasData(set)
                    ? 'Marcar serie completada'
                    : 'Coloca peso y reps'}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  )
}
