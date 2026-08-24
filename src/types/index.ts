/** Identificador de día de la semana (igual que Date.getDay(): 0=domingo … 6=sábado) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type ExerciseStatus = 'pending' | 'in_progress' | 'completed'
export type SessionStatus = 'in_progress' | 'completed'

export type ImprovementType =
  | 'weight' // subió el peso
  | 'reps' // más reps con el mismo peso
  | 'weight_same_reps' // más peso manteniendo (o superando) reps

export interface RepRange {
  min: number
  max: number
}

/** Ejercicio dentro de un día de rutina (plantilla) */
export interface RoutineExercise {
  id: string
  name: string
  targetSets: number
  targetReps: RepRange
  targetRir: number
  order: number
  /** Ruta pública por defecto, p.ej. /exercises/default.svg */
  imageUrl: string
  /** Link de tutorial (YouTube u otro), opcional */
  videoUrl?: string
  /** Si true, la imagen real está como blob en IndexedDB (tabla exerciseImages) */
  hasCustomImage?: boolean
}

export interface RoutineDay {
  id: string
  weekday: Weekday
  label: string
  muscleGroups: string[]
  exercises: RoutineExercise[]
}

export interface Routine {
  id: string
  name: string
  days: RoutineDay[]
  createdAt: number
  updatedAt: number
}

/** Una serie registrada en una sesión */
export interface SetLog {
  id: string
  setNumber: number
  weight: number | null
  reps: number | null
  rir: number | null
  completed: boolean
  completedAt?: number
}

/** Instancia de un ejercicio dentro de una sesión */
export interface ExerciseLog {
  id: string
  routineExerciseId: string
  name: string
  targetSets: number
  targetReps: RepRange
  targetRir: number
  imageUrl: string
  videoUrl?: string
  hasCustomImage?: boolean
  order: number
  status: ExerciseStatus
  sets: SetLog[]
  completedAt?: number
}

export interface WorkoutSession {
  id: string
  routineId: string
  routineDayId: string
  /** Etiqueta del día (ej. "Lunes — Pecho") para historial */
  dayLabel: string
  muscleGroups: string[]
  date: string // YYYY-MM-DD
  status: SessionStatus
  startedAt: number
  finishedAt?: number
  durationMs?: number
  exercises: ExerciseLog[]
}

/** Imagen personalizada de un ejercicio, guardada como blob local */
export interface ExerciseImage {
  id: string // = routineExerciseId
  blob: Blob
  mimeType: string
  updatedAt: number
}

export interface Improvement {
  id: string
  exerciseName: string
  routineExerciseId: string
  sessionId: string
  type: ImprovementType
  message: string
  detectedAt: number
  /** Snapshot útil para UI */
  previousBest?: { weight: number | null; reps: number | null }
  currentBest?: { weight: number | null; reps: number | null }
}

/** Resumen de la última vez que se hizo un ejercicio */
export interface LastExercisePerformance {
  sessionId: string
  date: string
  finishedAt?: number
  exerciseName: string
  sets: Array<{
    setNumber: number
    weight: number | null
    reps: number | null
    rir: number | null
    completed: boolean
  }>
}

export interface SessionSummary {
  sessionId: string
  date: string
  dayLabel: string
  durationMs: number
  completedExercises: number
  totalExercises: number
  totalSetsCompleted: number
  muscleGroups: string[]
}
