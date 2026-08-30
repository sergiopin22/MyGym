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
  /** true = no entrenas este día (ej. sábado/domingo) */
  isRestDay?: boolean
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
  /** Solo ejercicios de espalda: serie hecha con straps de agarre */
  withStraps?: boolean
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
  /** Nota opcional del día (cómo se sintió, dolor, etc.) */
  note?: string
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
  /** true = entreno de recuperación (fin de semana) */
  isRecovery?: boolean
  /** Día de la rutina que se está recuperando */
  recoveredWeekday?: Weekday
  recoveredDayLabel?: string
  /** Si se corrigió después de completar (historial) */
  editedAt?: number
}

export type PrizePresetId =
  | 'pork_roll'
  | 'empanadas'
  | 'ensalada'
  | 'custom'

export type ConstancyGoalStatus = 'active' | 'completed'

/** Meta de constancia (entrenamientos → premio) */
export interface ConstancyGoal {
  id: string
  targetCount: number
  currentCount: number
  prizePreset: PrizePresetId
  prizeLabel: string
  status: ConstancyGoalStatus
  createdAt: number
  updatedAt: number
  completedAt?: number
  /**
   * Fallos netos de gym en la semana actual (descanso no cuenta;
   * un día recuperado el finde ya no cuenta como fallo).
   */
  consecutiveMisses: number
  /** Última fecha evaluada para fallos (YYYY-MM-DD) */
  lastEvaluatedDate?: string
  /** Semana ISO en la que ya usó recuperación, ej. 2026-W35 */
  recoveryWeekKey?: string
  /** Semana en la que ya se reinició la meta por ≥3 fallos */
  resetWeekKey?: string
  /** Semana en la que ya se mostró / aceptó la penitencia (≥2 fallos netos) */
  penanceWeekKey?: string
  /** Texto de la penitencia (ej. pagar $30 a Helen) */
  penanceLabel?: string
}

export const PRIZE_PRESETS: Array<{
  id: Exclude<PrizePresetId, 'custom'>
  label: string
}> = [
  {
    id: 'pork_roll',
    label: 'Hamburguesa pork roll con salchipapa',
  },
  {
    id: 'empanadas',
    label: 'Empanadas grandes de arempas y oblea',
  },
  {
    id: 'ensalada',
    label: 'Ensalada de frutas y panda con bastante pollo dulce',
  },
]

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
    withStraps?: boolean
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
  isRecovery?: boolean
  recoveredDayLabel?: string
  editedAt?: number
}

export type BodyPhotoAngle = 'front' | 'side' | 'back'

/** Check-in físico semanal (miércoles) */
export interface BodyCheckIn {
  id: string
  date: string // YYYY-MM-DD
  createdAt: number
  /** Peso corporal en libras */
  weightLb: number
  bicepsCm: number
  waistCm: number
  chestCm: number
  thighCm: number
  note?: string
}

export interface BodyCheckInPhoto {
  id: string
  checkInId: string
  angle: BodyPhotoAngle
  blob: Blob
  mimeType: string
  updatedAt: number
}

