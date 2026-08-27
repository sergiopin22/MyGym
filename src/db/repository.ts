import { db } from './schema'
import type {
  BodyCheckIn,
  BodyCheckInPhoto,
  BodyPhotoAngle,
  ConstancyGoal,
  ExerciseImage,
  ExerciseLog,
  LastExercisePerformance,
  PrizePresetId,
  Routine,
  RoutineDay,
  RoutineExercise,
  SessionSummary,
  SetLog,
  Weekday,
  WorkoutSession,
} from '../types'
import {
  addDaysISO,
  createId,
  isoWeekKey,
  isWeekend,
  startOfWeekMonday,
  todayISODate,
  weekdayFromISO,
  weekdayLabel,
} from '../utils/id'
import {
  buildExerciseLogFromRoutine,
  computeExerciseStatus,
  getIncompleteWorkoutParts,
} from '../utils/workout'

const DEFAULT_IMAGE = '/exercises/default.svg'
const DEFAULT_ROUTINE_NAME = 'Mi rutina semanal'

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function validateExerciseInput(input: {
  name?: string
  targetSets?: number
  targetReps?: { min: number; max: number }
  targetRir?: number
}): {
  name: string
  targetSets: number
  targetReps: { min: number; max: number }
  targetRir: number
} {
  const name = (input.name ?? '').trim()
  if (!name) throw new Error('El ejercicio necesita un nombre.')

  const targetSets = clampInt(input.targetSets ?? 3, 1, 12)
  const min = clampInt(input.targetReps?.min ?? 8, 1, 50)
  const max = clampInt(input.targetReps?.max ?? 12, 1, 50)
  if (min > max) {
    throw new Error('El rango de reps es inválido (mínimo > máximo).')
  }
  const targetRir = clampInt(input.targetRir ?? 2, 0, 12)

  return {
    name,
    targetSets,
    targetReps: { min, max },
    targetRir,
  }
}

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Lun → Dom

function isWeekendRest(weekday: Weekday) {
  return weekday === 0 || weekday === 6
}

function defaultDays(): RoutineDay[] {
  return WEEKDAY_ORDER.map((weekday) => ({
    id: createId('day'),
    weekday,
    label: isWeekendRest(weekday) ? 'Descanso' : weekdayLabel(weekday),
    muscleGroups: [],
    exercises: [],
    isRestDay: isWeekendRest(weekday),
  }))
}

/** Rellena isRestDay en rutinas antiguas (sáb/dom = descanso por defecto) */
function normalizeRoutine(routine: Routine): { routine: Routine; changed: boolean } {
  let changed = false
  const days = routine.days.map((day) => {
    if (day.isRestDay !== undefined) return day
    changed = true
    const rest = isWeekendRest(day.weekday)
    return {
      ...day,
      isRestDay: rest,
      label: rest && day.label === weekdayLabel(day.weekday) ? 'Descanso' : day.label,
    }
  })
  return changed ? { routine: { ...routine, days }, changed: true } : { routine, changed: false }
}

async function loadRoutineNormalized(routine: Routine): Promise<Routine> {
  const { routine: normalized, changed } = normalizeRoutine(routine)
  if (changed) return saveRoutine(normalized)
  return normalized
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
  if (existing) return loadRoutineNormalized(existing)

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
  const routine = await db.routines.orderBy('updatedAt').reverse().first()
  if (!routine) return undefined
  const { routine: normalized, changed } = normalizeRoutine(routine)
  if (changed) return saveRoutine(normalized)
  return normalized
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
  patch: Partial<Pick<RoutineDay, 'label' | 'muscleGroups' | 'weekday' | 'isRestDay'>>,
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

export async function setDayRestMode(
  dayId: string,
  isRestDay: boolean,
  routineId?: string,
): Promise<RoutineDay> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  return updateRoutineDay(
    dayId,
    {
      isRestDay,
      label: isRestDay
        ? day.label === weekdayLabel(day.weekday)
          ? 'Descanso'
          : day.label
        : day.label === 'Descanso'
          ? weekdayLabel(day.weekday)
          : day.label,
    },
    routine.id,
  )
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

  const validated = validateExerciseInput(input)

  const exercise: RoutineExercise = {
    id: createId('ex'),
    name: validated.name,
    targetSets: validated.targetSets,
    targetReps: validated.targetReps,
    targetRir: validated.targetRir,
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

  const validated = validateExerciseInput({
    name: patch.name !== undefined ? patch.name : current.name,
    targetSets: patch.targetSets !== undefined ? patch.targetSets : current.targetSets,
    targetReps: patch.targetReps !== undefined ? patch.targetReps : current.targetReps,
    targetRir: patch.targetRir !== undefined ? patch.targetRir : current.targetRir,
  })

  const updated: RoutineExercise = {
    ...current,
    ...patch,
    name: validated.name,
    targetSets: validated.targetSets,
    targetReps: validated.targetReps,
    targetRir: validated.targetRir,
  }
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
  if (orderedExerciseIds.length !== day.exercises.length) {
    throw new Error('La lista de ejercicios para reordenar está incompleta.')
  }
  for (const id of orderedExerciseIds) {
    if (!byId.has(id)) {
      throw new Error('Hay un ejercicio desconocido en el reordenamiento.')
    }
  }
  const reordered = orderedExerciseIds.map((id, index) => {
    const ex = byId.get(id)!
    return { ...ex, order: index }
  })

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
  options?: { recovery?: boolean },
): Promise<WorkoutSession> {
  const existing = await getActiveSession()
  if (existing) {
    if (existing.routineDayId === routineDayId) return existing
    throw new Error(
      `Ya tienes un entrenamiento en curso (${existing.dayLabel}). Continúalo o cancélalo antes de empezar otro.`,
    )
  }

  const found = await getRoutineDay(routineDayId, routineId)
  if (!found) throw new Error('Día de rutina no encontrado')
  const { routine, day } = found
  const recovery = Boolean(options?.recovery)
  const todayWeekday = new Date().getDay() as Weekday

  if (recovery) {
    if (!isWeekend(todayWeekday)) {
      throw new Error('Solo puedes recuperar un día perdido el sábado o domingo.')
    }
    const eligible = await getRecoverableMissedDays()
    if (!eligible.some((d) => d.id === day.id)) {
      throw new Error('Ese día no está disponible para recuperar esta semana.')
    }
  } else if (day.weekday !== todayWeekday) {
    throw new Error(
      `Hoy es ${weekdayLabel(todayWeekday)}. Solo puedes iniciar el entrenamiento de hoy.`,
    )
  }

  if (day.isRestDay) {
    throw new Error('Este día está marcado como descanso.')
  }

  if (day.exercises.length === 0) {
    throw new Error('Este día no tiene ejercicios. Agrégalos en Rutinas.')
  }

  if (!recovery) {
    const alreadyDone = await getCompletedSessionToday(day.id)
    if (alreadyDone) {
      throw new Error('Ya completaste el entrenamiento de hoy.')
    }
  }

  const session: WorkoutSession = {
    id: createId('session'),
    routineId: routine.id,
    routineDayId: day.id,
    dayLabel: recovery
      ? `${day.label} (Recuperado · ${weekdayLabel(day.weekday)})`
      : day.label,
    muscleGroups: [...day.muscleGroups],
    date: todayISODate(),
    status: 'in_progress',
    startedAt: Date.now(),
    exercises: sortExercises(day.exercises).map((ex) =>
      buildExerciseLogFromRoutine(ex, () => createId('elog')),
    ),
    isRecovery: recovery || undefined,
    recoveredWeekday: recovery ? day.weekday : undefined,
    recoveredDayLabel: recovery ? weekdayLabel(day.weekday) : undefined,
  }

  await db.sessions.add(session)
  return session
}

/** Sesión completada hoy para un día de rutina (si existe) */
export async function getCompletedSessionToday(
  routineDayId?: string,
): Promise<WorkoutSession | undefined> {
  const today = todayISODate()
  const sessions = await db.sessions
    .where('date')
    .equals(today)
    .filter((s) => s.status === 'completed')
    .toArray()

  if (routineDayId) {
    return sessions.find((s) => s.routineDayId === routineDayId)
  }
  return sessions.sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0]
}

/** Cancela y borra un entrenamiento en progreso (p. ej. iniciado por error) */
export async function cancelSession(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('Solo se pueden cancelar entrenamientos en curso')
  }
  await db.sessions.delete(sessionId)
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

  const exercise = session.exercises.find((e) => e.id === exerciseLogId)
  if (!exercise) throw new Error('Ejercicio no encontrado en la sesión')
  const currentSet = exercise.sets.find((s) => s.id === setId)
  if (!currentSet) throw new Error('Serie no encontrada')

  const nextWeight =
    patch.weight !== undefined ? patch.weight : currentSet.weight
  const nextReps = patch.reps !== undefined ? patch.reps : currentSet.reps
  if (patch.completed === true && (nextWeight == null || nextReps == null)) {
    throw new Error('Coloca peso y reps antes de marcar la serie.')
  }

  const exercises = session.exercises.map((ex) => {
    if (ex.id !== exerciseLogId) return ex

    const sets = ex.sets.map((s) => {
      if (s.id !== setId) return s
      return {
        ...s,
        ...patch,
        completedAt:
          patch.completed === true
            ? Date.now()
            : patch.completed === false
              ? undefined
              : s.completedAt,
      } satisfies SetLog
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

export async function updateExerciseNote(
  sessionId: string,
  exerciseLogId: string,
  note: string,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

  const trimmed = note.trim()
  const exercises = session.exercises.map((ex) =>
    ex.id === exerciseLogId
      ? { ...ex, note: trimmed ? trimmed : undefined }
      : ex,
  )

  return saveSession({ ...session, exercises })
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
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

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
  newPRs: SessionNewPR[]
}> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status === 'completed') {
    return {
      session,
      summary: toSummary(session),
      newPRs: await detectNewPRsInSession(session),
    }
  }

  const leftover = getIncompleteWorkoutParts(session)
  if (leftover.incompleteSets > 0) {
    throw new Error(
      `Aún faltan ${leftover.incompleteSets} serie${leftover.incompleteSets === 1 ? '' : 's'} en ${leftover.incompleteExercises} ejercicio${leftover.incompleteExercises === 1 ? '' : 's'}. Completa todo antes de finalizar.`,
    )
  }

  const finishedAt = Date.now()
  const completed: WorkoutSession = {
    ...session,
    status: 'completed',
    finishedAt,
    durationMs: finishedAt - session.startedAt,
  }
  await saveSession(completed)
  await onWorkoutCompletedForConstancy(completed)

  return {
    session: completed,
    summary: toSummary(completed),
    newPRs: await detectNewPRsInSession(completed),
  }
}

/**
 * Corrige peso/reps/RIR de una sesión ya completada.
 * No toca la meta de constancia ni el día de la rutina.
 * Los PRs se recalculan solos al leer el historial.
 */
export async function saveCompletedSessionEdits(
  sessionId: string,
  nextExercises: ExerciseLog[],
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'completed') {
    throw new Error('Solo se pueden editar entrenamientos ya completados.')
  }

  if (nextExercises.length !== session.exercises.length) {
    throw new Error('No se puede cambiar la lista de ejercicios de esta sesión.')
  }

  const byId = new Map(session.exercises.map((e) => [e.id, e]))
  const normalized: ExerciseLog[] = []

  for (const draft of nextExercises) {
    const original = byId.get(draft.id)
    if (!original) {
      throw new Error('Hay un ejercicio que no pertenece a esta sesión.')
    }
    if (draft.sets.length !== original.sets.length) {
      throw new Error(`No se pueden agregar ni quitar series en ${original.name}.`)
    }

    const originalSetIds = new Set(original.sets.map((s) => s.id))
    const sets = draft.sets.map((s) => {
      if (!originalSetIds.has(s.id)) {
        throw new Error(`Serie inválida en ${original.name}.`)
      }
      if (s.completed && (s.weight == null || s.reps == null)) {
        throw new Error(
          `En ${original.name}, serie ${s.setNumber}: coloca peso y reps o desmárcala.`,
        )
      }
      return {
        ...s,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
        completed: s.completed,
        completedAt: s.completed
          ? s.completedAt ?? Date.now()
          : undefined,
      } satisfies SetLog
    })

    const status = computeExerciseStatus(sets)
    normalized.push({
      ...original,
      note: draft.note,
      sets,
      status,
      completedAt:
        status === 'completed'
          ? original.completedAt ?? Date.now()
          : undefined,
    })
  }

  const leftover = getIncompleteWorkoutParts({
    ...session,
    exercises: normalized,
  })
  if (leftover.incompleteSets > 0) {
    throw new Error(
      `Quedan ${leftover.incompleteSets} serie(s) incompletas. Completa peso y reps o marca las series.`,
    )
  }

  const updated: WorkoutSession = {
    ...session,
    exercises: normalized,
    editedAt: Date.now(),
  }
  await saveSession(updated)
  return updated
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
    isRecovery: session.isRecovery,
    recoveredDayLabel: session.recoveredDayLabel,
    editedAt: session.editedAt,
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

/** Contadores de progreso de una sesión en curso */
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

// ─── Check-in corporal (miércoles) ───────────────────────────────────────────

export async function listBodyCheckIns(): Promise<BodyCheckIn[]> {
  const rows = await db.bodyCheckIns.orderBy('date').toArray()
  return rows.reverse()
}

export async function getBodyCheckInById(
  id: string,
): Promise<BodyCheckIn | undefined> {
  return db.bodyCheckIns.get(id)
}

export async function getBodyCheckInForDate(
  date: string,
): Promise<BodyCheckIn | undefined> {
  return db.bodyCheckIns.where('date').equals(date).first()
}

export async function getBodyCheckInPhotos(
  checkInId: string,
): Promise<BodyCheckInPhoto[]> {
  return db.bodyCheckInPhotos.where('checkInId').equals(checkInId).toArray()
}

export async function saveBodyCheckIn(input: {
  weightLb: number
  bicepsCm: number
  waistCm: number
  chestCm: number
  thighCm: number
  note?: string
  photos: Partial<Record<BodyPhotoAngle, Blob>>
  date?: string
}): Promise<BodyCheckIn> {
  const date = input.date ?? todayISODate()
  const existing = await getBodyCheckInForDate(date)

  const checkIn: BodyCheckIn = {
    id: existing?.id ?? createId('body'),
    date,
    createdAt: existing?.createdAt ?? Date.now(),
    weightLb: input.weightLb,
    bicepsCm: input.bicepsCm,
    waistCm: input.waistCm,
    chestCm: input.chestCm,
    thighCm: input.thighCm,
    note: input.note?.trim() || undefined,
  }

  await db.transaction('rw', db.bodyCheckIns, db.bodyCheckInPhotos, async () => {
    await db.bodyCheckIns.put(checkIn)

    for (const angle of ['front', 'side', 'back'] as BodyPhotoAngle[]) {
      const blob = input.photos[angle]
      if (!blob) continue
      const photoId = `${checkIn.id}_${angle}`
      await db.bodyCheckInPhotos.put({
        id: photoId,
        checkInId: checkIn.id,
        angle,
        blob,
        mimeType: blob.type || 'image/jpeg',
        updatedAt: Date.now(),
      })
    }
  })

  return checkIn
}

export async function getFirstAndLatestBodyCheckIns(): Promise<{
  first?: BodyCheckIn
  latest?: BodyCheckIn
}> {
  const all = await db.bodyCheckIns.orderBy('date').toArray()
  if (all.length === 0) return {}
  return { first: all[0], latest: all[all.length - 1] }
}

export async function getBodyPhotoObjectUrl(
  checkInId: string,
  angle: BodyPhotoAngle,
): Promise<string | null> {
  const photo = await db.bodyCheckInPhotos.get(`${checkInId}_${angle}`)
  if (!photo) return null
  return URL.createObjectURL(photo.blob)
}

/* ─── Meta de constancia ─── */

export async function getActiveConstancyGoal(): Promise<ConstancyGoal | undefined> {
  const active = await db.constancyGoals.where('status').equals('active').first()
  if (!active) return undefined
  const withToday = await creditTodaysWorkoutIfCreatedAfter(active)
  if (withToday.status !== 'active') return undefined
  return evaluateConstancyMisses(withToday)
}

export async function getLatestConstancyGoal(): Promise<ConstancyGoal | undefined> {
  const all = await db.constancyGoals.orderBy('updatedAt').reverse().toArray()
  return all[0]
}

export async function createConstancyGoal(input: {
  targetCount: number
  prizePreset: PrizePresetId
  prizeLabel: string
}): Promise<ConstancyGoal> {
  const target = Math.max(1, Math.floor(input.targetCount))
  const label = input.prizeLabel.trim()
  if (!label) throw new Error('Escribe o elige un premio.')

  const existing = await db.constancyGoals.where('status').equals('active').first()
  if (existing) {
    throw new Error('Ya tienes una meta activa. Complétala o créala de nuevo al terminar.')
  }

  /** Si ya entrenaste hoy (antes de crear la meta), cuenta ese día */
  const alreadyTrainedToday = await getCompletedSessionToday()
  const initialCount = alreadyTrainedToday ? 1 : 0
  const now = Date.now()
  const reached = initialCount >= target

  const goal: ConstancyGoal = {
    id: createId('goal'),
    targetCount: target,
    currentCount: reached ? target : initialCount,
    prizePreset: input.prizePreset,
    prizeLabel: label,
    status: reached ? 'completed' : 'active',
    createdAt: now,
    updatedAt: now,
    completedAt: reached ? now : undefined,
    consecutiveMisses: 0,
    lastEvaluatedDate: todayISODate(),
    penanceLabel: 'Donar $30 USD a Helen',
    recoveryWeekKey:
      alreadyTrainedToday?.isRecovery ? isoWeekKey() : undefined,
  }
  await db.constancyGoals.add(goal)
  return goal
}

/**
 * Si creaste la meta el mismo día que ya habías entrenado,
 * y el contador quedó en 0, suma ese entreno.
 */
async function creditTodaysWorkoutIfCreatedAfter(
  goal: ConstancyGoal,
): Promise<ConstancyGoal> {
  if (goal.status !== 'active') return goal
  if (goal.currentCount > 0) return goal

  const today = todayISODate()
  const createdDate = todayISODate(new Date(goal.createdAt))
  if (createdDate !== today) return goal

  const done = await getCompletedSessionToday()
  if (!done) return goal

  let currentCount = 1
  let status: ConstancyGoal['status'] = 'active'
  let completedAt = goal.completedAt
  if (currentCount >= goal.targetCount) {
    currentCount = goal.targetCount
    status = 'completed'
    completedAt = Date.now()
  }

  const updated: ConstancyGoal = {
    ...goal,
    currentCount,
    status,
    completedAt,
    consecutiveMisses: 0,
    updatedAt: Date.now(),
    lastEvaluatedDate: today,
    recoveryWeekKey: done.isRecovery ? isoWeekKey() : goal.recoveryWeekKey,
  }
  await db.constancyGoals.put(updated)
  return updated
}

/** Elimina la meta activa para poder crear otra */
export async function abandonConstancyGoal(): Promise<void> {
  const active = await db.constancyGoals.where('status').equals('active').first()
  if (!active) return
  await db.constancyGoals.delete(active.id)
}

async function gymDayFulfilled(
  date: string,
  day: RoutineDay,
): Promise<boolean> {
  const onDate = await db.sessions
    .where('date')
    .equals(date)
    .filter(
      (s) =>
        s.status === 'completed' &&
        s.routineDayId === day.id &&
        !s.isRecovery,
    )
    .count()
  if (onDate > 0) return true

  const weekStart = todayISODate(startOfWeekMonday(new Date(date + 'T12:00:00')))
  const weekEnd = addDaysISO(weekStart, 6)
  const recovered = await db.sessions
    .where('date')
    .between(weekStart, weekEnd, true, true)
    .filter(
      (s) =>
        s.status === 'completed' &&
        Boolean(s.isRecovery) &&
        s.recoveredWeekday === day.weekday,
    )
    .count()
  return recovered > 0
}

export interface WeekMissStats {
  weekKey: string
  weekStart: string
  /** Días de gym no cumplidos ni recuperados (hasta ayer, o hasta domingo si ya pasó) */
  netMisses: number
  missedLabels: string[]
}

/** Fallos netos de gym en una semana (recuperado = ya no es fallo) */
export async function getWeekMissStats(
  refDate = new Date(),
  options?: {
    /** Solo contar fallos desde esta fecha (día en que se creó la meta) */
    fromDate?: string
  },
): Promise<WeekMissStats> {
  const weekKey = isoWeekKey(refDate)
  const weekStart = todayISODate(startOfWeekMonday(refDate))
  const today = todayISODate()
  const yesterday = addDaysISO(today, -1)
  const weekEnd = addDaysISO(weekStart, 6)
  const lastDayToCheck = yesterday < weekEnd ? yesterday : weekEnd
  const fromDate = options?.fromDate

  const routine = await getActiveRoutine()
  const missedLabels: string[] = []

  if (!routine || lastDayToCheck < weekStart) {
    return { weekKey, weekStart, netMisses: 0, missedLabels }
  }

  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i)
    if (date > lastDayToCheck) break
    /** Días anteriores a crear la meta no cuentan como fallo */
    if (fromDate && date < fromDate) continue

    const weekday = weekdayFromISO(date) as Weekday
    const day = routine.days.find((d) => d.weekday === weekday)
    if (!day || day.isRestDay || day.exercises.length === 0) continue

    const ok = await gymDayFulfilled(date, day)
    if (!ok) missedLabels.push(weekdayLabel(weekday))
  }

  return {
    weekKey,
    weekStart,
    netMisses: missedLabels.length,
    missedLabels,
  }
}

const WEEKLY_RESET_MISSES = 3
const WEEKLY_PENANCE_MISSES = 2

function goalStartDate(goal: ConstancyGoal): string {
  return todayISODate(new Date(goal.createdAt))
}

/** Evalúa fallos de la semana: ≥3 netos reinician; guarda contador para la UI */
export async function evaluateConstancyMisses(
  goal: ConstancyGoal,
): Promise<ConstancyGoal> {
  if (goal.status !== 'active') return goal

  const yesterday = addDaysISO(todayISODate(), -1)
  const fromDate = goalStartDate(goal)
  const stats = await getWeekMissStats(new Date(), { fromDate })
  let currentCount = goal.currentCount
  let resetWeekKey = goal.resetWeekKey
  const consecutiveMisses = stats.netMisses

  if (
    stats.netMisses >= WEEKLY_RESET_MISSES &&
    goal.resetWeekKey !== stats.weekKey
  ) {
    currentCount = 0
    resetWeekKey = stats.weekKey
  }

  const updated: ConstancyGoal = {
    ...goal,
    consecutiveMisses,
    currentCount,
    resetWeekKey,
    lastEvaluatedDate: yesterday,
    updatedAt: Date.now(),
    penanceLabel: goal.penanceLabel ?? 'Donar $30 USD a Helen',
  }
  await db.constancyGoals.put(updated)
  return updated
}

export async function getPenanceStatus(): Promise<{
  owed: boolean
  netMisses: number
  missedLabels: string[]
  penanceLabel: string
  weekKey: string
  acknowledged: boolean
} | null> {
  const goal = await db.constancyGoals.where('status').equals('active').first()
  if (!goal) return null

  const now = new Date()
  const todayWeekday = now.getDay()
  const penanceLabel = goal.penanceLabel ?? 'Donar $30 USD a Helen'
  const fromDate = goalStartDate(goal)

  /**
   * La penitencia se cierra el domingo a las 23:59.
   * Antes de eso (todo el domingo) aún puedes recuperar.
   * El lunes se muestra la de la semana que acaba de cerrar
   * (solo si la meta ya existía en esa semana).
   */
  const isSundayAfterClose =
    todayWeekday === 0 &&
    (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 59))
  const isMonday = todayWeekday === 1
  const windowOpen = isSundayAfterClose || isMonday

  const checkDate = isMonday
    ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
    : now
  const stats = await getWeekMissStats(checkDate, { fromDate })
  const weekEnd = addDaysISO(stats.weekStart, 6)

  /** La meta se creó después de esa semana → no hay penitencia de esa semana */
  const goalExistedInWeek = fromDate <= weekEnd
  const acknowledged = goal.penanceWeekKey === stats.weekKey
  const owed =
    windowOpen &&
    goalExistedInWeek &&
    stats.netMisses >= WEEKLY_PENANCE_MISSES

  return {
    owed,
    netMisses: stats.netMisses,
    missedLabels: stats.missedLabels,
    penanceLabel,
    weekKey: stats.weekKey,
    acknowledged,
  }
}

export async function acknowledgePenance(): Promise<void> {
  const goal = await db.constancyGoals.where('status').equals('active').first()
  if (!goal) return
  const todayWeekday = new Date().getDay()
  const checkDate =
    todayWeekday === 1
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date()
  const weekKey = isoWeekKey(checkDate)
  await db.constancyGoals.put({
    ...goal,
    penanceWeekKey: weekKey,
    updatedAt: Date.now(),
  })
}

async function onWorkoutCompletedForConstancy(
  session: WorkoutSession,
): Promise<void> {
  const raw = await db.constancyGoals.where('status').equals('active').first()
  if (!raw) return

  const goal = await evaluateConstancyMisses(raw)
  if (goal.status !== 'active') return

  const stats = await getWeekMissStats(new Date(), {
    fromDate: goalStartDate(goal),
  })
  let currentCount = goal.currentCount + 1
  let status: ConstancyGoal['status'] = 'active'
  let completedAt = goal.completedAt

  if (currentCount >= goal.targetCount) {
    currentCount = goal.targetCount
    status = 'completed'
    completedAt = Date.now()
  }

  const updated: ConstancyGoal = {
    ...goal,
    currentCount,
    consecutiveMisses: stats.netMisses,
    status,
    completedAt,
    updatedAt: Date.now(),
    lastEvaluatedDate: todayISODate(),
    recoveryWeekKey: session.isRecovery
      ? isoWeekKey()
      : goal.recoveryWeekKey,
  }
  await db.constancyGoals.put(updated)
}

/** Días de gym de esta semana que faltaron (para recuperar en sáb/dom) */
export async function getRecoverableMissedDays(): Promise<RoutineDay[]> {
  if (!isWeekend()) return []

  const weekKey = isoWeekKey()
  const goal = await db.constancyGoals.where('status').equals('active').first()
  if (goal?.recoveryWeekKey === weekKey) return []

  const monday = startOfWeekMonday()
  const weekStart = todayISODate(monday)
  const weekEnd = addDaysISO(weekStart, 6)
  const today = todayISODate()

  const weekSessions = await db.sessions
    .where('date')
    .between(weekStart, weekEnd, true, true)
    .filter((s) => s.status === 'completed')
    .toArray()

  if (weekSessions.some((s) => s.isRecovery)) return []

  const routine = await getActiveRoutine()
  if (!routine) return []

  const missed: RoutineDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i)
    if (date >= today) continue

    const weekday = weekdayFromISO(date) as Weekday
    const day = routine.days.find((d) => d.weekday === weekday)
    if (!day || day.isRestDay || day.exercises.length === 0) continue

    const doneOnDay = weekSessions.some(
      (s) =>
        s.date === date && s.routineDayId === day.id && !s.isRecovery,
    )
    const recovered = weekSessions.some(
      (s) => s.isRecovery && s.recoveredWeekday === day.weekday,
    )
    if (!doneOnDay && !recovered) missed.push(day)
  }

  return missed
}

export async function canUseRecoveryThisWeek(): Promise<boolean> {
  if (!isWeekend()) return false
  const missed = await getRecoverableMissedDays()
  return missed.length > 0
}

/* ─── Marcas personales (PR) ─── */

export interface ExercisePR {
  exerciseName: string
  weight: number
  reps: number
  /** RIR de la serie del PR (puede ser null si no se registró) */
  rir: number | null
  date: string
  sessionId: string
}

/** Ejercicios estrella que se muestran primero en el botón PR */
export const FEATURED_PR_EXERCISES: Array<{
  label: string
  /** fragmentos para emparejar con el nombre en la rutina */
  match: string[]
}> = [
  {
    label: 'Elevaciones laterales con mancuerna',
    match: ['elevaciones laterales', 'elevacion lateral', 'lateral mancuerna'],
  },
  {
    label: 'Press inclinado en máquina',
    match: ['press inclinado'],
  },
  {
    label: 'Jalón al pecho',
    match: ['jalon al pecho', 'jalón al pecho', 'jalon pecho', 'jalón pecho'],
  },
  {
    label: 'Remo T',
    match: ['remo t', 'remo-t', 'remo en t'],
  },
  {
    label: 'Predicador',
    match: ['predicador'],
  },
  {
    label: 'Sentadilla hack',
    match: ['sentadilla hack', 'hack squat', 'hack'],
  },
]

function normalizeExerciseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function exerciseNameMatches(name: string, fragments: string[]): boolean {
  const n = normalizeExerciseName(name)
  return fragments.some((f) => n.includes(normalizeExerciseName(f)))
}

function isBetterPR(
  candidate: { weight: number; reps: number },
  current: { weight: number; reps: number } | null,
): boolean {
  if (!current) return true
  if (candidate.weight > current.weight) return true
  if (candidate.weight === current.weight && candidate.reps > current.reps) {
    return true
  }
  return false
}

/** PR de todas las máquinas vistas en historial (mejor peso; si empata, más reps) */
export async function getAllExercisePRs(
  excludeSessionId?: string,
): Promise<ExercisePR[]> {
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .toArray()

  const best = new Map<string, ExercisePR>()

  for (const session of sessions) {
    if (excludeSessionId && session.id === excludeSessionId) continue
    for (const ex of session.exercises) {
      const key = normalizeExerciseName(ex.name)
      if (!key) continue
      for (const set of ex.sets) {
        if (!set.completed || set.weight == null || set.reps == null) continue
        if (set.weight <= 0 || set.reps <= 0) continue
        const prev = best.get(key) ?? null
        const cand = { weight: set.weight, reps: set.reps }
        if (!isBetterPR(cand, prev)) continue
        best.set(key, {
          exerciseName: ex.name,
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          date: session.date,
          sessionId: session.id,
        })
      }
    }
  }

  return [...best.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

export interface SessionNewPR {
  exerciseName: string
  weight: number
  reps: number
  rir: number | null
  /** null = primera marca registrada de ese ejercicio */
  previous: { weight: number; reps: number } | null
}

/** Detecta PRs nuevos de una sesión vs el historial (excluyendo esa sesión) */
export async function detectNewPRsInSession(
  session: WorkoutSession,
): Promise<SessionNewPR[]> {
  const prior = await getAllExercisePRs(session.id)
  const priorByKey = new Map(
    prior.map((p) => [normalizeExerciseName(p.exerciseName), p]),
  )

  const found: SessionNewPR[] = []

  for (const ex of session.exercises) {
    const key = normalizeExerciseName(ex.name)
    if (!key) continue

    let bestInSession: {
      weight: number
      reps: number
      rir: number | null
    } | null = null

    for (const set of ex.sets) {
      if (!set.completed || set.weight == null || set.reps == null) continue
      if (set.weight <= 0 || set.reps <= 0) continue
      const cand = { weight: set.weight, reps: set.reps, rir: set.rir }
      if (!isBetterPR(cand, bestInSession)) continue
      bestInSession = cand
    }

    if (!bestInSession) continue

    const prev = priorByKey.get(key) ?? null
    if (!isBetterPR(bestInSession, prev)) continue

    found.push({
      exerciseName: ex.name,
      weight: bestInSession.weight,
      reps: bestInSession.reps,
      rir: bestInSession.rir,
      previous: prev
        ? { weight: prev.weight, reps: prev.reps }
        : null,
    })
  }

  return found.sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

/**
 * Todos los ejercicios de la rutina activa + su PR si existe.
 * Así “Cualquier máquina” lista todo lo que tienes creado.
 */
export async function getRoutineExercisePRs(): Promise<
  Array<{ exerciseName: string; dayLabels: string[]; pr: ExercisePR | null }>
> {
  const routine = await getActiveRoutine()
  const prs = await getAllExercisePRs()
  const prByKey = new Map(
    prs.map((p) => [normalizeExerciseName(p.exerciseName), p]),
  )

  const byKey = new Map<
    string,
    { exerciseName: string; dayLabels: string[]; pr: ExercisePR | null }
  >()

  if (routine) {
    for (const day of routine.days) {
      if (day.isRestDay) continue
      for (const ex of day.exercises) {
        const key = normalizeExerciseName(ex.name)
        if (!key) continue
        const existing = byKey.get(key)
        if (existing) {
          if (!existing.dayLabels.includes(day.label)) {
            existing.dayLabels.push(day.label)
          }
        } else {
          byKey.set(key, {
            exerciseName: ex.name,
            dayLabels: [day.label],
            pr: prByKey.get(key) ?? null,
          })
        }
      }
    }
  }

  /** Incluye PRs de nombres que ya no están en rutina (historial viejo) */
  for (const pr of prs) {
    const key = normalizeExerciseName(pr.exerciseName)
    if (!byKey.has(key)) {
      byKey.set(key, {
        exerciseName: pr.exerciseName,
        dayLabels: [],
        pr,
      })
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

export async function getFeaturedExercisePRs(): Promise<
  Array<{ label: string; pr: ExercisePR | null }>
> {
  const all = await getAllExercisePRs()
  return FEATURED_PR_EXERCISES.map((feat) => {
    const pr =
      all.find((p) => exerciseNameMatches(p.exerciseName, feat.match)) ?? null
    return { label: feat.label, pr }
  })
}
