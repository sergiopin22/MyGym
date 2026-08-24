import { db } from './schema'
import type {
  ExerciseImage,
  ExerciseLog,
  Improvement,
  LastExercisePerformance,
  Routine,
  RoutineDay,
  RoutineExercise,
  SessionSummary,
  SetLog,
  Weekday,
  WorkoutSession,
} from '../types'
import { createId, todayISODate, weekdayLabel } from '../utils/id'
import {
  buildExerciseLogFromRoutine,
  computeExerciseStatus,
  detectImprovement,
  getBestCompletedSet,
} from '../utils/workout'

const DEFAULT_IMAGE = '/exercises/default.svg'
const DEFAULT_ROUTINE_NAME = 'Mi rutina semanal'

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Lun → Dom

function defaultDays(): RoutineDay[] {
  return WEEKDAY_ORDER.map((weekday) => ({
    id: createId('day'),
    weekday,
    label: weekdayLabel(weekday),
    muscleGroups: [],
    exercises: [],
  }))
}

function touch(routine: Routine): Routine {
  return { ...routine, updatedAt: Date.now() }
}

function sortExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order)
}

function findDay(routine: Routine, dayId: string): RoutineDay | undefined {
  return routine.days.find((d) => d.id === dayId)
}

function replaceDay(routine: Routine, day: RoutineDay): Routine {
  return touch({
    ...routine,
    days: routine.days.map((d) => (d.id === day.id ? day : d)),
  })
}

// ─── Rutinas ─────────────────────────────────────────────────────────────────

export async function ensureDefaultRoutine(): Promise<Routine> {
  const existing = await db.routines.orderBy('updatedAt').reverse().first()
  if (existing) return existing

  const now = Date.now()
  const routine: Routine = {
    id: createId('routine'),
    name: DEFAULT_ROUTINE_NAME,
    days: defaultDays(),
    createdAt: now,
    updatedAt: now,
  }
  await db.routines.add(routine)
  return routine
}

export async function getActiveRoutine(): Promise<Routine | undefined> {
  return db.routines.orderBy('updatedAt').reverse().first()
}

export async function getRoutineById(id: string): Promise<Routine | undefined> {
  return db.routines.get(id)
}

export async function saveRoutine(routine: Routine): Promise<Routine> {
  const next = touch(routine)
  await db.routines.put(next)
  return next
}

export async function updateRoutineName(id: string, name: string): Promise<Routine> {
  const routine = await requireRoutine(id)
  return saveRoutine({ ...routine, name: name.trim() || routine.name })
}

async function requireRoutine(id?: string): Promise<Routine> {
  const routine = id ? await getRoutineById(id) : await ensureDefaultRoutine()
  if (!routine) throw new Error('No hay rutina disponible')
  return routine
}

export async function getRoutineDay(
  dayId: string,
  routineId?: string,
): Promise<{ routine: Routine; day: RoutineDay } | undefined> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) return undefined
  return { routine, day: { ...day, exercises: sortExercises(day.exercises) } }
}

export async function getDayByWeekday(
  weekday: Weekday,
  routineId?: string,
): Promise<{ routine: Routine; day: RoutineDay } | undefined> {
  const routine = await requireRoutine(routineId)
  const day = routine.days.find((d) => d.weekday === weekday)
  if (!day) return undefined
  return { routine, day: { ...day, exercises: sortExercises(day.exercises) } }
}

export async function updateRoutineDay(
  dayId: string,
  patch: Partial<Pick<RoutineDay, 'label' | 'muscleGroups' | 'weekday'>>,
  routineId?: string,
): Promise<RoutineDay> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const nextDay: RoutineDay = {
    ...day,
    ...patch,
    muscleGroups: patch.muscleGroups ?? day.muscleGroups,
  }
  await saveRoutine(replaceDay(routine, nextDay))
  return nextDay
}

export async function addExerciseToDay(
  dayId: string,
  input: {
    name: string
    targetSets?: number
    targetReps?: { min: number; max: number }
    targetRir?: number
    videoUrl?: string
    imageUrl?: string
  },
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const exercise: RoutineExercise = {
    id: createId('ex'),
    name: input.name.trim(),
    targetSets: input.targetSets ?? 3,
    targetReps: input.targetReps ?? { min: 8, max: 12 },
    targetRir: input.targetRir ?? 2,
    order: day.exercises.length,
    imageUrl: input.imageUrl ?? DEFAULT_IMAGE,
    videoUrl: input.videoUrl,
    hasCustomImage: false,
  }

  const nextDay: RoutineDay = {
    ...day,
    exercises: [...day.exercises, exercise],
  }
  await saveRoutine(replaceDay(routine, nextDay))
  return exercise
}

export async function updateExercise(
  dayId: string,
  exerciseId: string,
  patch: Partial<
    Pick<
      RoutineExercise,
      | 'name'
      | 'targetSets'
      | 'targetReps'
      | 'targetRir'
      | 'videoUrl'
      | 'imageUrl'
      | 'hasCustomImage'
      | 'order'
    >
  >,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const updated: RoutineExercise = { ...current, ...patch }
  const nextDay: RoutineDay = {
    ...day,
    exercises: day.exercises.map((e) => (e.id === exerciseId ? updated : e)),
  }
  await saveRoutine(replaceDay(routine, nextDay))
  return updated
}

export async function removeExerciseFromDay(
  dayId: string,
  exerciseId: string,
  routineId?: string,
): Promise<void> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const remaining = sortExercises(
    day.exercises.filter((e) => e.id !== exerciseId),
  ).map((e, index) => ({ ...e, order: index }))

  await saveRoutine(replaceDay(routine, { ...day, exercises: remaining }))
  await db.exerciseImages.delete(exerciseId)
}

export async function reorderExercises(
  dayId: string,
  orderedExerciseIds: string[],
  routineId?: string,
): Promise<RoutineDay> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const byId = new Map(day.exercises.map((e) => [e.id, e]))
  const reordered = orderedExerciseIds
    .map((id, index) => {
      const ex = byId.get(id)
      return ex ? { ...ex, order: index } : null
    })
    .filter((e): e is RoutineExercise => e !== null)

  const nextDay = { ...day, exercises: reordered }
  await saveRoutine(replaceDay(routine, nextDay))
  return nextDay
}

/**
 * Copia ejercicios de un día a otro (ej. Lunes pecho → Jueves pecho).
 * Crea nuevos IDs; también duplica fotos custom si existen.
 */
export async function copyExercisesFromDay(
  fromDayId: string,
  toDayId: string,
  options: {
    mode?: 'replace' | 'append'
    copyMuscleGroups?: boolean
    routineId?: string
  } = {},
): Promise<RoutineDay> {
  const { mode = 'replace', copyMuscleGroups = false, routineId } = options
  if (fromDayId === toDayId) {
    throw new Error('Elige un día distinto para copiar')
  }

  const routine = await requireRoutine(routineId)
  const fromDay = findDay(routine, fromDayId)
  const toDay = findDay(routine, toDayId)
  if (!fromDay || !toDay) throw new Error('Día de rutina no encontrado')

  const source = sortExercises(fromDay.exercises)
  if (source.length === 0) {
    throw new Error('Ese día no tiene ejercicios para copiar')
  }

  if (mode === 'replace' && toDay.exercises.length > 0) {
    await db.exerciseImages.bulkDelete(toDay.exercises.map((e) => e.id))
  }

  const startOrder = mode === 'append' ? toDay.exercises.length : 0
  const clones: RoutineExercise[] = source.map((ex, index) => ({
    id: createId('ex'),
    name: ex.name,
    targetSets: ex.targetSets,
    targetReps: { ...ex.targetReps },
    targetRir: ex.targetRir,
    order: startOrder + index,
    imageUrl: ex.imageUrl,
    videoUrl: ex.videoUrl,
    hasCustomImage: false,
  }))

  // Duplicar blobs de imagen con el nuevo id
  for (let i = 0; i < source.length; i++) {
    const src = source[i]
    const clone = clones[i]
    if (!src.hasCustomImage) continue
    const img = await db.exerciseImages.get(src.id)
    if (!img) continue
    await db.exerciseImages.put({
      id: clone.id,
      blob: img.blob,
      mimeType: img.mimeType,
      updatedAt: Date.now(),
    })
    clone.hasCustomImage = true
  }

  const nextExercises =
    mode === 'append' ? [...sortExercises(toDay.exercises), ...clones] : clones

  const nextDay: RoutineDay = {
    ...toDay,
    exercises: nextExercises,
    muscleGroups: copyMuscleGroups
      ? [...fromDay.muscleGroups]
      : toDay.muscleGroups,
  }

  await saveRoutine(replaceDay(routine, nextDay))
  return { ...nextDay, exercises: sortExercises(nextDay.exercises) }
}

// ─── Imágenes de ejercicio ───────────────────────────────────────────────────

export async function saveExerciseImage(
  routineExerciseId: string,
  blob: Blob,
  dayId: string,
  routineId?: string,
): Promise<ExerciseImage> {
  const record: ExerciseImage = {
    id: routineExerciseId,
    blob,
    mimeType: blob.type || 'image/jpeg',
    updatedAt: Date.now(),
  }
  await db.exerciseImages.put(record)
  await updateExercise(dayId, routineExerciseId, { hasCustomImage: true }, routineId)
  return record
}

export async function getExerciseImage(
  routineExerciseId: string,
): Promise<ExerciseImage | undefined> {
  return db.exerciseImages.get(routineExerciseId)
}

export async function clearExerciseImage(
  routineExerciseId: string,
  dayId: string,
  routineId?: string,
): Promise<void> {
  await db.exerciseImages.delete(routineExerciseId)
  await updateExercise(
    dayId,
    routineExerciseId,
    { hasCustomImage: false, imageUrl: DEFAULT_IMAGE },
    routineId,
  )
}

/** Devuelve object URL temporal; el caller debe revokeObjectURL cuando deje de usarlo */
export async function getExerciseImageObjectUrl(
  routineExerciseId: string,
): Promise<string | null> {
  const img = await getExerciseImage(routineExerciseId)
  if (!img) return null
  return URL.createObjectURL(img.blob)
}

// ─── Sesiones de entrenamiento ───────────────────────────────────────────────

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  return db.sessions.where('status').equals('in_progress').first()
}

export async function getSessionById(
  id: string,
): Promise<WorkoutSession | undefined> {
  return db.sessions.get(id)
}

export async function startSession(
  routineDayId: string,
  routineId?: string,
): Promise<WorkoutSession> {
  const existing = await getActiveSession()
  if (existing) return existing

  const found = await getRoutineDay(routineDayId, routineId)
  if (!found) throw new Error('Día de rutina no encontrado')
  const { routine, day } = found

  if (day.exercises.length === 0) {
    throw new Error('Este día no tiene ejercicios. Agrégalos en Rutinas.')
  }

  const session: WorkoutSession = {
    id: createId('session'),
    routineId: routine.id,
    routineDayId: day.id,
    dayLabel: day.label,
    muscleGroups: [...day.muscleGroups],
    date: todayISODate(),
    status: 'in_progress',
    startedAt: Date.now(),
    exercises: sortExercises(day.exercises).map((ex) =>
      buildExerciseLogFromRoutine(ex, () => createId('elog')),
    ),
  }

  await db.sessions.add(session)
  return session
}

export async function saveSession(session: WorkoutSession): Promise<WorkoutSession> {
  await db.sessions.put(session)
  return session
}

export async function updateSet(
  sessionId: string,
  exerciseLogId: string,
  setId: string,
  patch: Partial<Pick<SetLog, 'weight' | 'reps' | 'rir' | 'completed'>>,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

  const exercises = session.exercises.map((ex) => {
    if (ex.id !== exerciseLogId) return ex

    const sets = ex.sets.map((s) => {
      if (s.id !== setId) return s
      const next: SetLog = {
        ...s,
        ...patch,
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
    const wasCompleted = ex.status === 'completed'
    const nowCompleted = status === 'completed'

    return {
      ...ex,
      sets,
      status,
      completedAt: nowCompleted && !wasCompleted ? Date.now() : ex.completedAt,
    } satisfies ExerciseLog
  })

  const next: WorkoutSession = { ...session, exercises }
  await saveSession(next)

  const updatedEx = exercises.find((e) => e.id === exerciseLogId)
  if (
    updatedEx &&
    updatedEx.status === 'completed' &&
    session.exercises.find((e) => e.id === exerciseLogId)?.status !== 'completed'
  ) {
    await maybeRecordImprovement(next, updatedEx)
  }

  return next
}

export async function markSetCompleted(
  sessionId: string,
  exerciseLogId: string,
  setId: string,
  completed = true,
): Promise<WorkoutSession> {
  return updateSet(sessionId, exerciseLogId, setId, { completed })
}

/**
 * Copia el peso de la última vez a las series de hoy.
 * Deja reps y RIR vacíos (null).
 */
export async function applyPreviousWeights(
  sessionId: string,
  exerciseLogId: string,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')

  const exercise = session.exercises.find((e) => e.id === exerciseLogId)
  if (!exercise) throw new Error('Ejercicio no encontrado en la sesión')

  const last = await getLastExercisePerformance(exercise.name, session.id)
  if (!last) throw new Error('No hay historial previo para este ejercicio')

  const weights = last.sets.map((s) => s.weight)
  const sets = exercise.sets.map((s, index) => ({
    ...s,
    weight: weights[index] ?? weights[weights.length - 1] ?? null,
    reps: null,
    rir: null,
    completed: false,
    completedAt: undefined,
  }))

  const exercises = session.exercises.map((ex) =>
    ex.id === exerciseLogId
      ? { ...ex, sets, status: computeExerciseStatus(sets), completedAt: undefined }
      : ex,
  )

  return saveSession({ ...session, exercises })
}

export async function completeSession(sessionId: string): Promise<{
  session: WorkoutSession
  summary: SessionSummary
}> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')

  const finishedAt = Date.now()
  const completed: WorkoutSession = {
    ...session,
    status: 'completed',
    finishedAt,
    durationMs: finishedAt - session.startedAt,
  }
  await saveSession(completed)

  return { session: completed, summary: toSummary(completed) }
}

function toSummary(session: WorkoutSession): SessionSummary {
  const completedExercises = session.exercises.filter(
    (e) => e.status === 'completed',
  ).length
  const totalSetsCompleted = session.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0,
  )
  return {
    sessionId: session.id,
    date: session.date,
    dayLabel: session.dayLabel,
    durationMs: session.durationMs ?? 0,
    completedExercises,
    totalExercises: session.exercises.length,
    totalSetsCompleted,
    muscleGroups: session.muscleGroups,
  }
}

// ─── Historial y “última vez” ────────────────────────────────────────────────

export async function getHistory(
  limit = 50,
): Promise<SessionSummary[]> {
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .sortBy('startedAt')

  // Más recientes primero
  return sessions.reverse().slice(0, limit).map(toSummary)
}

export async function getSessionDetail(
  sessionId: string,
): Promise<WorkoutSession | undefined> {
  return getSessionById(sessionId)
}

/**
 * Busca la última ocasión REAL en que se hizo este ejercicio
 * (por nombre, en sesiones completadas), ignorando la sesión actual.
 */
export async function getLastExercisePerformance(
  exerciseName: string,
  excludeSessionId?: string,
): Promise<LastExercisePerformance | undefined> {
  const name = exerciseName.trim().toLowerCase()
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .sortBy('startedAt')

  // Recorremos de más reciente a más antigua
  for (const session of sessions.reverse()) {
    if (excludeSessionId && session.id === excludeSessionId) continue
    const match = session.exercises.find(
      (e) => e.name.trim().toLowerCase() === name,
    )
    if (!match) continue
    if (!match.sets.some((s) => s.completed)) continue

    return {
      sessionId: session.id,
      date: session.date,
      finishedAt: session.finishedAt,
      exerciseName: match.name,
      sets: match.sets.map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
        completed: s.completed,
      })),
    }
  }
  return undefined
}

export async function getExerciseHistory(
  exerciseName: string,
  limit = 20,
): Promise<
  Array<{
    sessionId: string
    date: string
    dayLabel: string
    sets: SetLog[]
    status: ExerciseLog['status']
  }>
> {
  const name = exerciseName.trim().toLowerCase()
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .sortBy('startedAt')

  const results: Array<{
    sessionId: string
    date: string
    dayLabel: string
    sets: SetLog[]
    status: ExerciseLog['status']
  }> = []

  for (const session of sessions.reverse()) {
    const match = session.exercises.find(
      (e) => e.name.trim().toLowerCase() === name,
    )
    if (!match) continue
    results.push({
      sessionId: session.id,
      date: session.date,
      dayLabel: session.dayLabel,
      sets: match.sets,
      status: match.status,
    })
    if (results.length >= limit) break
  }
  return results
}

// ─── Mejoras / progreso ──────────────────────────────────────────────────────

async function maybeRecordImprovement(
  session: WorkoutSession,
  exercise: ExerciseLog,
): Promise<Improvement | null> {
  const last = await getLastExercisePerformance(exercise.name, session.id)
  if (!last) return null

  const previousSets: SetLog[] = last.sets.map((s) => ({
    id: createId(),
    setNumber: s.setNumber,
    weight: s.weight,
    reps: s.reps,
    rir: s.rir,
    completed: s.completed,
  }))

  const detected = detectImprovement(exercise.sets, previousSets)
  if (!detected) return null

  const prevBest = getBestCompletedSet(previousSets)
  const curBest = getBestCompletedSet(exercise.sets)

  const improvement: Improvement = {
    id: createId('imp'),
    exerciseName: exercise.name,
    routineExerciseId: exercise.routineExerciseId,
    sessionId: session.id,
    type: detected.type,
    message: detected.message,
    detectedAt: Date.now(),
    previousBest: prevBest
      ? { weight: prevBest.weight, reps: prevBest.reps }
      : undefined,
    currentBest: curBest
      ? { weight: curBest.weight, reps: curBest.reps }
      : undefined,
  }

  await db.improvements.put(improvement)
  return improvement
}

export async function getRecentImprovements(
  limit = 30,
): Promise<Improvement[]> {
  const all = await db.improvements.orderBy('detectedAt').reverse().limit(limit).toArray()
  return all
}

export async function getSessionProgress(sessionId: string): Promise<{
  completed: number
  total: number
  percent: number
}> {
  const session = await getSessionById(sessionId)
  if (!session) return { completed: 0, total: 0, percent: 0 }
  const completed = session.exercises.filter((e) => e.status === 'completed').length
  const total = session.exercises.length
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

/** Contadores para la pantalla de inicio del día seleccionado */
export async function getHomeDaySnapshot(weekday: Weekday): Promise<{
  routine: Routine
  day: RoutineDay
  activeSession: WorkoutSession | undefined
  completedCount: number
  totalCount: number
}> {
  const found = await getDayByWeekday(weekday)
  if (!found) throw new Error('No hay rutina configurada')

  const activeSession = await getActiveSession()
  const relevantSession =
    activeSession && activeSession.routineDayId === found.day.id
      ? activeSession
      : undefined

  const totalCount = found.day.exercises.length
  const completedCount = relevantSession
    ? relevantSession.exercises.filter((e) => e.status === 'completed').length
    : 0

  return {
    routine: found.routine,
    day: found.day,
    activeSession: relevantSession,
    completedCount,
    totalCount,
  }
}
