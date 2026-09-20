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

/** Serie real: cuenta para PR, gráfica y “última vez”. */
export function isWorkingSet(set: Pick<SetLog, 'completed' | 'weight' | 'reps'>): boolean {
  return (
    Boolean(set.completed) &&
    set.weight != null &&
    set.weight > 0 &&
    set.reps != null &&
    set.reps > 0
  )
}

export function hasWorkingSets(exercise: Pick<ExerciseLog, 'sets'>): boolean {
  return exercise.sets.some(isWorkingSet)
}

export function computeExerciseStatus(
  sets: SetLog[],
  previous?: ExerciseStatus,
): ExerciseStatus {
  const completedCount = sets.filter((s) => s.completed).length
  if (completedCount === 0) {
    return previous === 'skipped' ? 'skipped' : 'pending'
  }
  if (completedCount >= sets.length) return 'completed'
  return 'in_progress'
}

export function markExerciseSkipped(exercise: ExerciseLog): ExerciseLog {
  return {
    ...exercise,
    status: 'skipped',
    completedAt: undefined,
  }
}

export function unmarkExerciseSkipped(exercise: ExerciseLog): ExerciseLog {
  const status = computeExerciseStatus(exercise.sets)
  return {
    ...exercise,
    status,
    completedAt:
      status === 'completed' ? exercise.completedAt ?? Date.now() : undefined,
  }
}

/** Ejercicios sin ninguna serie hecha → omitidos. Los que ya tienen series quedan como están. */
export function skipUnstartedExercises(exercises: ExerciseLog[]): ExerciseLog[] {
  return exercises.map((ex) => {
    if (ex.status === 'skipped') return ex
    if (ex.sets.some((s) => s.completed)) return ex
    return markExerciseSkipped(ex)
  })
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
    if (ex.status === 'skipped') continue
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

/** Bloquea finalizar: ejercicios que no se hicieron ni se omitieron. */
export function getUnstartedWorkoutParts(session: WorkoutSession): {
  unstartedExercises: number
  names: string[]
} {
  const names: string[] = []

  for (const ex of [...session.exercises].sort((a, b) => a.order - b.order)) {
    if (ex.status === 'skipped') continue
    if (ex.sets.some((s) => s.completed)) continue
    names.push(ex.name)
  }

  return {
    unstartedExercises: names.length,
    names,
  }
}

export function buildExerciseLogFromRoutine(
  exercise: RoutineExercise,
  createId: () => string,
): ExerciseLog {
  const plannedName = exercise.name
  return {
    id: createId(),
    routineExerciseId: exercise.id,
    name: plannedName,
    plannedName,
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

/** Compatibilidad con sesiones antiguas (sin plannedName). */
export function getPlannedExerciseName(exercise: {
  name: string
  plannedName?: string
}): string {
  return exercise.plannedName?.trim() || exercise.name
}

export function isUsingAlternative(exercise: {
  name: string
  plannedName?: string
  activeAlternativeId?: string
}): boolean {
  if (exercise.activeAlternativeId) return true
  const planned = getPlannedExerciseName(exercise)
  return planned !== exercise.name
}

export function getActiveGripName(exercise: {
  activeGripName?: string
}): string | undefined {
  const g = exercise.activeGripName?.trim()
  return g || undefined
}

export type { LastExercisePerformance, Routine, RoutineDay, RoutineExercise, SessionSummary, Weekday, WorkoutSession }
