import type {
  ExerciseLog,
  ExerciseStatus,
  Improvement,
  ImprovementType,
  LastExercisePerformance,
  Routine,
  RoutineDay,
  RoutineExercise,
  SessionSummary,
  SetLog,
  Weekday,
  WorkoutSession,
} from '../types'

const DEFAULT_IMAGE = '/exercises/default.svg'

/** Mejor serie de un log: prioriza peso, luego reps */
export function getBestCompletedSet(sets: SetLog[]): SetLog | null {
  const completed = sets.filter((s) => s.completed && s.weight != null)
  if (completed.length === 0) {
    const withReps = sets.filter((s) => s.completed && s.reps != null)
    return withReps.sort((a, b) => (b.reps ?? 0) - (a.reps ?? 0))[0] ?? null
  }
  return (
    completed.sort((a, b) => {
      const dw = (b.weight ?? 0) - (a.weight ?? 0)
      if (dw !== 0) return dw
      return (b.reps ?? 0) - (a.reps ?? 0)
    })[0] ?? null
  )
}

export function computeExerciseStatus(sets: SetLog[]): ExerciseStatus {
  const completedCount = sets.filter((s) => s.completed).length
  if (completedCount === 0) return 'pending'
  if (completedCount >= sets.length) return 'completed'
  return 'in_progress'
}

/**
 * Comparación simple vs última vez:
 * - 🏆 más peso
 * - 🔥 más reps con mismo peso
 * - 🏆 más peso manteniendo reps
 */
export function detectImprovement(
  current: SetLog[],
  previous: SetLog[],
): { type: ImprovementType; message: string } | null {
  const cur = getBestCompletedSet(current)
  const prev = getBestCompletedSet(previous)
  if (!cur || !prev || cur.weight == null || prev.weight == null) return null

  const curReps = cur.reps ?? 0
  const prevReps = prev.reps ?? 0

  if (cur.weight > prev.weight && curReps >= prevReps) {
    return {
      type: 'weight_same_reps',
      message: `🏆 Nuevo mejor: ${cur.weight} lb × ${curReps} (antes ${prev.weight} lb × ${prevReps})`,
    }
  }
  if (cur.weight > prev.weight) {
    return {
      type: 'weight',
      message: `🏆 Más peso: ${cur.weight} lb (antes ${prev.weight} lb)`,
    }
  }
  if (cur.weight === prev.weight && curReps > prevReps) {
    return {
      type: 'reps',
      message: `🔥 Más reps: ${curReps} @ ${cur.weight} lb (antes ${prevReps})`,
    }
  }
  return null
}

export function emptySets(targetSets: number, createId: () => string): SetLog[] {
  return Array.from({ length: targetSets }, (_, i) => ({
    id: createId(),
    setNumber: i + 1,
    weight: null,
    reps: null,
    rir: null,
    completed: false,
  }))
}

export function getIncompleteWorkoutParts(session: WorkoutSession): {
  incompleteExercises: number
  incompleteSets: number
  details: string[]
} {
  const details: string[] = []
  let incompleteSets = 0

  for (const ex of [...session.exercises].sort((a, b) => a.order - b.order)) {
    const pending = ex.sets.filter((s) => !s.completed).length
    if (pending === 0) continue
    incompleteSets += pending
    details.push(
      `${ex.name}: ${pending} serie${pending === 1 ? '' : 's'} sin completar`,
    )
  }

  return {
    incompleteExercises: details.length,
    incompleteSets,
    details,
  }
}

export function buildExerciseLogFromRoutine(
  exercise: RoutineExercise,
  createId: () => string,
): ExerciseLog {
  return {
    id: createId(),
    routineExerciseId: exercise.id,
    name: exercise.name,
    targetSets: exercise.targetSets,
    targetReps: { ...exercise.targetReps },
    targetRir: exercise.targetRir,
    imageUrl: exercise.imageUrl || DEFAULT_IMAGE,
    videoUrl: exercise.videoUrl,
    hasCustomImage: exercise.hasCustomImage,
    order: exercise.order,
    status: 'pending',
    sets: emptySets(exercise.targetSets, createId),
  }
}

export type { Improvement, LastExercisePerformance, Routine, RoutineDay, RoutineExercise, SessionSummary, Weekday, WorkoutSession }
