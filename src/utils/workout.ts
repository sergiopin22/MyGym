import type {
  ExerciseLog,
  ExerciseStatus,
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

export function computeExerciseStatus(sets: SetLog[]): ExerciseStatus {
  const completedCount = sets.filter((s) => s.completed).length
  if (completedCount === 0) return 'pending'
  if (completedCount >= sets.length) return 'completed'
  return 'in_progress'
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

export type { LastExercisePerformance, Routine, RoutineDay, RoutineExercise, SessionSummary, Weekday, WorkoutSession }
