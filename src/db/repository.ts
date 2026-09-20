import { db } from './schema'
import type {
  BodyCheckIn,
  BodyCheckInPhoto,
  BodyPhotoAngle,
  ConstancyGoal,
  ExerciseAlternative,
  ExerciseGrip,
  ExerciseImage,
  ExerciseLog,
  LastExercisePerformance,
  PrizePresetId,
  Routine,
  RoutineDay,
  RoutineExercise,
  SessionSummary,
  SetLog,
  TreadmillSession,
  Weekday,
  WorkoutSession,
} from '../types'
import {
  addDaysISO,
  createId,
  isoWeekKey,
  isWeekend,
  parseISODate,
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
import { supportsStrapsTracking } from '../utils/straps'
import { machineIdentityKey, sameMachineName } from '../utils/machineName'

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

function sanitizeMuscleGroups(groups: string[] | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const group of groups ?? []) {
    const label = group.trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(label)
  }
  return out
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
    muscleGroups?: string[]
  },
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')

  const validated = validateExerciseInput(input)
  const muscleGroups = sanitizeMuscleGroups(input.muscleGroups)

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
    muscleGroups: muscleGroups.length ? muscleGroups : undefined,
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
      | 'alternatives'
      | 'underMaintenance'
      | 'grips'
      | 'muscleGroups'
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

  const muscleGroups =
    patch.muscleGroups !== undefined
      ? sanitizeMuscleGroups(patch.muscleGroups)
      : sanitizeMuscleGroups(current.muscleGroups)

  const updated: RoutineExercise = {
    ...current,
    ...patch,
    name: validated.name,
    targetSets: validated.targetSets,
    targetReps: validated.targetReps,
    targetRir: validated.targetRir,
    muscleGroups: muscleGroups.length ? muscleGroups : undefined,
  }
  const nextDay: RoutineDay = {
    ...day,
    exercises: day.exercises.map((e) => (e.id === exerciseId ? updated : e)),
  }
  await saveRoutine(replaceDay(routine, nextDay))
  return updated
}

function normalizeAltName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export async function addExerciseAlternative(
  dayId: string,
  exerciseId: string,
  name: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const trimmed = normalizeAltName(name)
  if (!trimmed) throw new Error('Ponle un nombre a la máquina alternativa')
  if (sameMachineName(trimmed, current.name)) {
    throw new Error('La alternativa no puede llamarse igual que la máquina oficial')
  }

  const existing = current.alternatives ?? []
  if (existing.some((a) => sameMachineName(a.name, trimmed))) {
    throw new Error('Esa alternativa ya está en el banco')
  }

  const nextDays = shareAlternativeOnOfficialMachine(
    routine,
    current.name,
    trimmed,
  )
  const saved = await saveRoutine({ ...routine, days: nextDays })
  const savedDay = findDay(saved, dayId)
  const savedEx = savedDay?.exercises.find((e) => e.id === exerciseId)
  if (!savedEx) throw new Error('Ejercicio no encontrado')
  return savedEx
}

function shareAlternativeOnOfficialMachine(
  routine: Routine,
  officialName: string,
  altName: string,
): RoutineDay[] {
  const trimmed = normalizeAltName(altName)
  return routine.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      if (!sameMachineName(ex.name, officialName)) return ex
      const existing = ex.alternatives ?? []
      if (existing.some((a) => sameMachineName(a.name, trimmed))) return ex
      return {
        ...ex,
        alternatives: [
          ...existing,
          { id: createId('alt'), name: trimmed, createdAt: Date.now() },
        ],
      }
    }),
  }))
}

export async function removeExerciseAlternative(
  dayId: string,
  exerciseId: string,
  alternativeId: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const target = (current.alternatives ?? []).find((a) => a.id === alternativeId)
  if (!target) throw new Error('Alternativa no encontrada')

  const nextDays = routine.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((ex) => {
      if (!sameMachineName(ex.name, current.name)) return ex
      return {
        ...ex,
        alternatives: (ex.alternatives ?? []).filter(
          (a) =>
            a.id !== alternativeId && !sameMachineName(a.name, target.name),
        ),
      }
    }),
  }))
  const saved = await saveRoutine({ ...routine, days: nextDays })
  const savedDay = findDay(saved, dayId)
  const savedEx = savedDay?.exercises.find((e) => e.id === exerciseId)
  if (!savedEx) throw new Error('Ejercicio no encontrado')
  return savedEx
}

export interface RoutineAlternativeRow {
  dayId: string
  dayLabel: string
  weekday: Weekday
  exerciseId: string
  officialName: string
  alternative: ExerciseAlternative
}

export interface SharedAlternativeRow {
  officialName: string
  alternativeName: string
  otherNames: string[]
  days: Array<{
    dayId: string
    dayLabel: string
    weekday: Weekday
    exerciseId: string
    alternativeId: string
  }>
  sessionCount: number
}

function alternativeGroupKey(officialName: string, altName: string): string {
  return `${normalizeExerciseName(officialName)}::${normalizeExerciseName(altName)}`
}

/** Alternativas agrupadas: una fila por máquina real, no por cada día. */
export async function listSharedAlternatives(
  routineId?: string,
): Promise<SharedAlternativeRow[]> {
  const rows = await listRoutineAlternatives(routineId)
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .toArray()

  const sessionCountByKey = new Map<string, number>()
  for (const session of sessions) {
    const seen = new Set<string>()
    for (const ex of session.exercises) {
      const key = normalizeExerciseName(ex.name)
      if (!key || seen.has(key)) continue
      seen.add(key)
      sessionCountByKey.set(key, (sessionCountByKey.get(key) ?? 0) + 1)
    }
  }

  type Acc = {
    officialName: string
    names: Map<string, { name: string; count: number }>
    days: SharedAlternativeRow['days']
  }
  const groups = new Map<string, Acc>()

  for (const row of rows) {
    const key = alternativeGroupKey(row.officialName, row.alternative.name)
    const existing = groups.get(key)
    const altKey = normalizeExerciseName(row.alternative.name)
    const uses = sessionCountByKey.get(altKey) ?? 0
    if (!existing) {
      groups.set(key, {
        officialName: row.officialName,
        names: new Map([
          [altKey, { name: row.alternative.name, count: uses }],
        ]),
        days: [
          {
            dayId: row.dayId,
            dayLabel: row.dayLabel,
            weekday: row.weekday,
            exerciseId: row.exerciseId,
            alternativeId: row.alternative.id,
          },
        ],
      })
      continue
    }
    const slot = existing.names.get(altKey)
    if (!slot || uses > slot.count) {
      existing.names.set(altKey, { name: row.alternative.name, count: uses })
    }
    existing.days.push({
      dayId: row.dayId,
      dayLabel: row.dayLabel,
      weekday: row.weekday,
      exerciseId: row.exerciseId,
      alternativeId: row.alternative.id,
    })
  }

  return [...groups.values()]
    .map((group) => {
      const ranked = [...group.names.values()].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'),
      )
      const alternativeName = ranked[0]?.name ?? ''
      const altKey = normalizeExerciseName(alternativeName)
      return {
        officialName: group.officialName,
        alternativeName,
        otherNames: ranked.slice(1).map((n) => n.name),
        days: group.days,
        sessionCount: sessionCountByKey.get(altKey) ?? 0,
      }
    })
    .sort((a, b) =>
      a.alternativeName.localeCompare(b.alternativeName, 'es'),
    )
}

/**
 * Deja una sola alternativa por máquina en todos los días y une el historial
 * de nombres parecidos (orden distinto, mayúsculas, etc.).
 */
export async function unifyAlternativeBank(routineId?: string): Promise<{
  sessionsUpdated: number
  copiesRemoved: number
}> {
  const groups = await listSharedAlternatives(routineId)
  let sessionsUpdated = 0
  for (const group of groups) {
    for (const other of group.otherNames) {
      if (sameMachineName(other, group.alternativeName) && other === group.alternativeName) {
        continue
      }
      const result = await mergeExerciseNames(other, group.alternativeName)
      sessionsUpdated += result.sessionsUpdated
    }
  }

  const routine = await requireRoutine(routineId)
  const before = JSON.stringify(routine.days)
  const byOfficial = new Map<
    string,
    { officialName: string; alts: Map<string, ExerciseAlternative> }
  >()

  for (const day of routine.days) {
    for (const ex of day.exercises) {
      const officialKey = normalizeExerciseName(ex.name)
      if (!officialKey) continue
      const slot =
        byOfficial.get(officialKey) ??
        ({ officialName: ex.name, alts: new Map() } satisfies {
          officialName: string
          alts: Map<string, ExerciseAlternative>
        })
      if (!byOfficial.has(officialKey)) byOfficial.set(officialKey, slot)
      for (const alt of ex.alternatives ?? []) {
        const altKey = normalizeExerciseName(alt.name)
        if (!altKey) continue
        const match = groups.find(
          (g) =>
            normalizeExerciseName(g.officialName) === officialKey &&
            normalizeExerciseName(g.alternativeName) === altKey,
        )
        const canonicalName = match?.alternativeName ?? alt.name
        const prev = slot.alts.get(altKey)
        if (!prev) {
          slot.alts.set(altKey, { ...alt, name: canonicalName })
        }
      }
    }
  }

  const nextDays = routine.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      const slot = byOfficial.get(normalizeExerciseName(ex.name))
      if (!slot) return ex
      const nextAlts = [...slot.alts.values()].map((alt) => {
        const local = (ex.alternatives ?? []).find((a) =>
          sameMachineName(a.name, alt.name),
        )
        return {
          id: local?.id ?? createId('alt'),
          name: alt.name,
          createdAt: local?.createdAt ?? alt.createdAt,
        }
      })
      return { ...ex, alternatives: nextAlts }
    }),
  }))

  const copiesRemoved = groups.reduce(
    (sum, group) => sum + Math.max(0, group.days.length - 1) + group.otherNames.length,
    0,
  )

  if (JSON.stringify(nextDays) !== before) {
    await saveRoutine({ ...routine, days: nextDays })
  }

  return { sessionsUpdated, copiesRemoved }
}

/** Todas las alternativas de la rutina, para verlas y quitarlas sin abrir cada ejercicio. */
export async function listRoutineAlternatives(
  routineId?: string,
): Promise<RoutineAlternativeRow[]> {
  const routine = await requireRoutine(routineId)
  const rows: RoutineAlternativeRow[] = []
  for (const day of routine.days) {
    if (day.isRestDay) continue
    for (const ex of sortExercises(day.exercises)) {
      for (const alt of ex.alternatives ?? []) {
        rows.push({
          dayId: day.id,
          dayLabel: day.label,
          weekday: day.weekday,
          exerciseId: ex.id,
          officialName: ex.name,
          alternative: alt,
        })
      }
    }
  }
  return rows.sort((a, b) =>
    a.alternative.name.localeCompare(b.alternative.name, 'es'),
  )
}

export async function renameExerciseAlternative(
  dayId: string,
  exerciseId: string,
  alternativeId: string,
  name: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const trimmed = normalizeAltName(name)
  if (!trimmed) throw new Error('Ponle un nombre a la máquina alternativa')
  if (sameMachineName(trimmed, current.name)) {
    throw new Error('La alternativa no puede llamarse igual que la máquina oficial')
  }

  const alts = current.alternatives ?? []
  if (!alts.some((a) => a.id === alternativeId)) {
    throw new Error('Alternativa no encontrada')
  }
  const target = alts.find((a) => a.id === alternativeId)!
  if (
    alts.some(
      (a) => a.id !== alternativeId && sameMachineName(a.name, trimmed),
    )
  ) {
    throw new Error('Esa alternativa ya está en el banco')
  }

  const nextDays = routine.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((ex) => {
      if (!sameMachineName(ex.name, current.name)) return ex
      return {
        ...ex,
        alternatives: (ex.alternatives ?? []).map((a) =>
          a.id === alternativeId || sameMachineName(a.name, target.name)
            ? { ...a, name: trimmed }
            : a,
        ),
      }
    }),
  }))
  const saved = await saveRoutine({ ...routine, days: nextDays })
  const savedDay = findDay(saved, dayId)
  const savedEx = savedDay?.exercises.find((e) => e.id === exerciseId)
  if (!savedEx) throw new Error('Ejercicio no encontrado')
  return savedEx
}

export async function setExerciseUnderMaintenance(
  dayId: string,
  exerciseId: string,
  underMaintenance: boolean,
  routineId?: string,
): Promise<RoutineExercise> {
  return updateExercise(
    dayId,
    exerciseId,
    { underMaintenance: underMaintenance || undefined },
    routineId,
  )
}

export async function addExerciseGrip(
  dayId: string,
  exerciseId: string,
  name: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const trimmed = normalizeAltName(name)
  if (!trimmed) throw new Error('Ponle un nombre al agarre')

  const existing = current.grips ?? []
  if (existing.some((g) => g.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Ese agarre ya está en la lista')
  }

  const grip: ExerciseGrip = {
    id: createId('grip'),
    name: trimmed,
    createdAt: Date.now(),
  }

  return updateExercise(
    dayId,
    exerciseId,
    { grips: [...existing, grip] },
    routine.id,
  )
}

export async function removeExerciseGrip(
  dayId: string,
  exerciseId: string,
  gripId: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  return updateExercise(
    dayId,
    exerciseId,
    { grips: (current.grips ?? []).filter((g) => g.id !== gripId) },
    routine.id,
  )
}

export async function renameExerciseGrip(
  dayId: string,
  exerciseId: string,
  gripId: string,
  name: string,
  routineId?: string,
): Promise<RoutineExercise> {
  const routine = await requireRoutine(routineId)
  const day = findDay(routine, dayId)
  if (!day) throw new Error('Día de rutina no encontrado')
  const current = day.exercises.find((e) => e.id === exerciseId)
  if (!current) throw new Error('Ejercicio no encontrado')

  const trimmed = normalizeAltName(name)
  if (!trimmed) throw new Error('Ponle un nombre al agarre')

  const grips = current.grips ?? []
  if (!grips.some((g) => g.id === gripId)) {
    throw new Error('Agarre no encontrado')
  }
  if (
    grips.some(
      (g) =>
        g.id !== gripId && g.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
  ) {
    throw new Error('Ese agarre ya está en la lista')
  }

  return updateExercise(
    dayId,
    exerciseId,
    {
      grips: grips.map((g) => (g.id === gripId ? { ...g, name: trimmed } : g)),
    },
    routine.id,
  )
}

export type SessionMachineChoice =
  | { type: 'original' }
  | { type: 'alternative'; alternativeId: string }
  | { type: 'new'; name: string }

/**
 * Cambia la máquina activa de un ejercicio en la sesión.
 * Los PR/historial siguen el `name` activo; `plannedName` conserva la oficial.
 */
export async function setSessionExerciseMachine(
  sessionId: string,
  exerciseLogId: string,
  choice: SessionMachineChoice,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

  const exercise = session.exercises.find((e) => e.id === exerciseLogId)
  if (!exercise) throw new Error('Ejercicio no encontrado en la sesión')

  const plannedName = exercise.plannedName?.trim() || exercise.name
  let nextName = plannedName
  let activeAlternativeId: string | undefined
  let routineUpdated = false

  if (choice.type === 'original') {
    nextName = plannedName
    activeAlternativeId = undefined
  } else {
    const found = await getRoutineDay(session.routineDayId, session.routineId)
    if (!found) throw new Error('Día de rutina no encontrado')
    const routineEx = found.day.exercises.find(
      (e) => e.id === exercise.routineExerciseId,
    )
    if (!routineEx) throw new Error('Ejercicio de rutina no encontrado')

    if (choice.type === 'alternative') {
      const alt = (routineEx.alternatives ?? []).find(
        (a) => a.id === choice.alternativeId,
      )
      if (!alt) throw new Error('Alternativa no encontrada')
      nextName = alt.name
      activeAlternativeId = alt.id
    } else {
      const updated = await addExerciseAlternative(
        found.day.id,
        routineEx.id,
        choice.name,
        found.routine.id,
      )
      routineUpdated = true
      const created = (updated.alternatives ?? []).find(
        (a) =>
          a.name.trim().toLowerCase() ===
          normalizeAltName(choice.name).toLowerCase(),
      )
      if (!created) throw new Error('No se pudo crear la alternativa')
      nextName = created.name
      activeAlternativeId = created.id
    }
    void routineUpdated
  }

  const exercises = session.exercises.map((ex) =>
    ex.id === exerciseLogId
      ? {
          ...ex,
          plannedName,
          name: nextName,
          activeAlternativeId,
        }
      : ex,
  )

  return saveSession({ ...session, exercises })
}

/** Elige el agarre del día (o null = sin variante / sin especificar). */
export async function setSessionExerciseGrip(
  sessionId: string,
  exerciseLogId: string,
  grip: { id: string; name: string } | null,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

  const exercises = session.exercises.map((ex) =>
    ex.id === exerciseLogId
      ? {
          ...ex,
          activeGripId: grip?.id,
          activeGripName: grip?.name,
        }
      : ex,
  )

  return saveSession({ ...session, exercises })
}

export async function getRoutineExerciseById(
  routineExerciseId: string,
  routineDayId: string,
  routineId?: string,
): Promise<RoutineExercise | undefined> {
  const found = await getRoutineDay(routineDayId, routineId)
  const exercise = found?.day.exercises.find((e) => e.id === routineExerciseId)
  if (!exercise || !found) return exercise

  const missing: ExerciseAlternative[] = []
  const have = new Set(
    (exercise.alternatives ?? []).map((a) => normalizeExerciseName(a.name)),
  )
  for (const day of found.routine.days) {
    for (const ex of day.exercises) {
      if (!sameMachineName(ex.name, exercise.name)) continue
      for (const alt of ex.alternatives ?? []) {
        const key = normalizeExerciseName(alt.name)
        if (!key || have.has(key)) continue
        have.add(key)
        missing.push({
          id: createId('alt'),
          name: alt.name,
          createdAt: alt.createdAt,
        })
      }
    }
  }
  if (missing.length === 0) return exercise
  return updateExercise(
    found.day.id,
    exercise.id,
    { alternatives: [...(exercise.alternatives ?? []), ...missing] },
    found.routine.id,
  )
}

function namesMatch(a: string, b: string): boolean {
  return sameMachineName(a, b)
}

/**
 * Sesiones completadas donde el ejercicio sigue etiquetado con el nombre oficial
 * (candidatas a mover a una alternativa).
 */
export async function listSessionsTaggedAsOfficialMachine(input: {
  routineExerciseId: string
  officialName: string
  limit?: number
}): Promise<
  Array<{
    sessionId: string
    date: string
    dayLabel: string
    exerciseLogId: string
    exerciseName: string
  }>
> {
  const limit = Math.max(1, Math.min(30, input.limit ?? 10))
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .sortBy('startedAt')

  const rows: Array<{
    sessionId: string
    date: string
    dayLabel: string
    exerciseLogId: string
    exerciseName: string
  }> = []

  for (const session of sessions.reverse()) {
    const match = session.exercises.find((ex) => {
      const isSameExercise =
        ex.routineExerciseId === input.routineExerciseId ||
        namesMatch(ex.name, input.officialName) ||
        namesMatch(ex.plannedName ?? '', input.officialName)
      if (!isSameExercise) return false
      // Solo las que aún están como la oficial (contaminadas)
      return namesMatch(ex.name, input.officialName)
    })
    if (!match) continue
    rows.push({
      sessionId: session.id,
      date: session.date,
      dayLabel: session.dayLabel,
      exerciseLogId: match.id,
      exerciseName: match.name,
    })
    if (rows.length >= limit) break
  }

  return rows
}

/**
 * Mueve las últimas N sesiones etiquetadas como la máquina oficial
 * hacia una alternativa (corrige historial/PR sin reescribir pesos).
 */
export async function reassignRecentSessionsToAlternative(input: {
  routineExerciseId: string
  officialName: string
  alternativeId: string
  alternativeName: string
  sessionCount: number
}): Promise<{ updatedSessions: number; dates: string[] }> {
  const count = Math.max(1, Math.min(20, Math.round(input.sessionCount)))
  const candidates = await listSessionsTaggedAsOfficialMachine({
    routineExerciseId: input.routineExerciseId,
    officialName: input.officialName,
    limit: count,
  })

  if (candidates.length === 0) {
    throw new Error(
      `No hay sesiones recientes guardadas como "${input.officialName}" para mover.`,
    )
  }

  const dates: string[] = []
  for (const row of candidates) {
    const session = await getSessionById(row.sessionId)
    if (!session) continue
    const exercises = session.exercises.map((ex) =>
      ex.id === row.exerciseLogId
        ? {
            ...ex,
            plannedName: input.officialName,
            name: input.alternativeName,
            activeAlternativeId: input.alternativeId,
          }
        : ex,
    )
    await saveSession({ ...session, exercises })
    dates.push(row.date)
  }

  return { updatedSessions: dates.length, dates }
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
    alternatives: (ex.alternatives ?? []).map((alt) => ({
      id: createId('alt'),
      name: alt.name,
      createdAt: alt.createdAt,
    })),
    grips: (ex.grips ?? []).map((g) => ({
      id: createId('grip'),
      name: g.name,
      createdAt: g.createdAt,
    })),
    underMaintenance: ex.underMaintenance,
    muscleGroups: (() => {
      const groups = sanitizeMuscleGroups(ex.muscleGroups)
      return groups.length ? groups : undefined
    })(),
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

export interface GymHeatmapCell {
  date: string
  done: boolean
  isToday: boolean
  isFuture: boolean
}

export interface GymHeatmapData {
  weeks: GymHeatmapCell[][]
  monthLabels: Array<{ label: string; weekIndex: number }>
  streak: number
  weekCount: number
  weekTarget: number
  doneToday: boolean
  totalGymDays: number
  totalSessions: number
}

const MONTH_SHORT_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

/** Heatmap estilo HabitKit: se llena con el historial de sesiones completadas */
export async function getGymHeatmapData(options?: {
  weekCount?: number
  weekTarget?: number
}): Promise<GymHeatmapData> {
  const today = todayISODate()
  const todayDate = parseISODate(today)

  let completed = await db.sessions.where('status').equals('completed').toArray()
  if (completed.length === 0) {
    completed = (await db.sessions.toArray()).filter(
      (s) => s.status === 'completed',
    )
  }

  const doneDates = new Set<string>()
  for (const session of completed) {
    const iso = normalizeSessionDate(session.date, session.finishedAt, session.startedAt)
    if (iso) doneDates.add(iso)
  }

  let weekTarget = options?.weekTarget
  if (weekTarget == null) {
    const routine = await getActiveRoutine()
    const trainingDays =
      routine?.days.filter((d) => !d.isRestDay).length ?? 0
    weekTarget = trainingDays > 0 ? Math.min(6, Math.max(3, trainingDays)) : 5
  }

  const thisMonday = startOfWeekMonday(todayDate)
  const sortedDates = [...doneDates].sort()
  const oldestIso = sortedDates[0] ?? today
  const oldestMonday = startOfWeekMonday(parseISODate(oldestIso))

  const diffMs = thisMonday.getTime() - oldestMonday.getTime()
  const spanWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  const autoWeeks = Math.max(12, Math.min(52, spanWeeks))
  const weekCount = options?.weekCount
    ? Math.max(8, Math.min(52, options.weekCount))
    : autoWeeks

  const startMonday = new Date(thisMonday)
  startMonday.setDate(thisMonday.getDate() - (weekCount - 1) * 7)

  const weeks: GymHeatmapCell[][] = []
  const monthLabels: Array<{ label: string; weekIndex: number }> = []
  let lastMonth = -1

  for (let w = 0; w < weekCount; w++) {
    const monday = new Date(startMonday)
    monday.setDate(startMonday.getDate() + w * 7)
    const week: GymHeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + d)
      const iso = todayISODate(day)
      week.push({
        date: iso,
        done: doneDates.has(iso),
        isToday: iso === today,
        isFuture: iso > today,
      })
    }
    weeks.push(week)

    const month = monday.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_SHORT_ES[month] ?? '', weekIndex: w })
      lastMonth = month
    }
  }

  let streakCursor = today
  if (!doneDates.has(today)) {
    streakCursor = addDaysISO(today, -1)
  }
  let streak = 0
  while (doneDates.has(streakCursor)) {
    streak += 1
    streakCursor = addDaysISO(streakCursor, -1)
  }

  const weekStart = todayISODate(thisMonday)
  const weekEnd = addDaysISO(weekStart, 6)
  let weekDone = 0
  for (const iso of doneDates) {
    if (iso >= weekStart && iso <= weekEnd) weekDone += 1
  }

  return {
    weeks,
    monthLabels,
    streak,
    weekCount: weekDone,
    weekTarget,
    doneToday: doneDates.has(today),
    totalGymDays: doneDates.size,
    totalSessions: completed.length,
  }
}

function normalizeSessionDate(
  date: string | undefined,
  finishedAt?: number,
  startedAt?: number,
): string | null {
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10)
  }
  const ts = finishedAt ?? startedAt
  if (ts && Number.isFinite(ts)) return todayISODate(new Date(ts))
  return null
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
  patch: Partial<Pick<SetLog, 'weight' | 'reps' | 'rir' | 'completed' | 'withStraps'>>,
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

export async function setExerciseStraps(
  sessionId: string,
  exerciseLogId: string,
  withStraps: boolean,
): Promise<WorkoutSession> {
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('Sesión no encontrada')
  if (session.status !== 'in_progress') {
    throw new Error('La sesión ya está finalizada')
  }

  const exercises = session.exercises.map((ex) => {
    if (ex.id !== exerciseLogId) return ex
    return {
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        withStraps: withStraps || undefined,
      })),
    }
  })

  return saveSession({ ...session, exercises })
}

/**
 * Copia el peso (y straps si aplica) de la última vez a las series de hoy.
 * Deja reps y RIR vacíos y desmarca las series.
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

  const last = await getLastExercisePerformance(
    exercise.name,
    session.id,
    exercise.activeGripName,
  )
  if (!last) throw new Error('No hay historial previo para este ejercicio')

  const weights = last.sets.map((s) => s.weight)
  const straps = last.sets.map((s) => s.withStraps)
  const sets = exercise.sets.map((s, index) => ({
    ...s,
    weight: weights[index] ?? weights[weights.length - 1] ?? null,
    reps: null,
    rir: null,
    withStraps: straps[index] ?? straps[straps.length - 1] ?? undefined,
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
        withStraps: s.withStraps || undefined,
        completedAt: s.completed
          ? s.completedAt ?? Date.now()
          : undefined,
      } satisfies SetLog
    })

    const status = computeExerciseStatus(sets)
    const plannedName =
      draft.plannedName?.trim() ||
      original.plannedName?.trim() ||
      original.name
    normalized.push({
      ...original,
      name: draft.name.trim() || original.name,
      plannedName,
      activeAlternativeId: draft.activeAlternativeId,
      activeGripId: draft.activeGripId,
      activeGripName: draft.activeGripName,
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
 * (por nombre + agarre, en sesiones completadas), ignorando la sesión actual.
 */
export async function getLastExercisePerformance(
  exerciseName: string,
  excludeSessionId?: string,
  gripName?: string | null,
): Promise<LastExercisePerformance | undefined> {
  const name = exerciseName.trim().toLowerCase()
  const grip = gripName?.trim().toLowerCase() || ''
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .sortBy('startedAt')

  for (const session of sessions.reverse()) {
    if (excludeSessionId && session.id === excludeSessionId) continue
    const match = session.exercises.find((e) => {
      if (e.name.trim().toLowerCase() !== name) return false
      const eg = e.activeGripName?.trim().toLowerCase() || ''
      return eg === grip
    })
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
        withStraps: s.withStraps,
      })),
    }
  }
  return undefined
}

/** PR actual de una máquina (y con straps si aplica), excluyendo la sesión en curso. */
export async function getExercisePRsForName(
  exerciseName: string,
  gripName?: string | null,
  excludeSessionId?: string,
): Promise<{ pr: ExercisePR | null; prWithStraps: ExercisePR | null }> {
  const wantName = normalizeExerciseName(exerciseName)
  const wantGrip = (gripName ?? '').trim().toLowerCase()
  if (!wantName) return { pr: null, prWithStraps: null }

  const all = await getAllExercisePRs(excludeSessionId)
  let pr: ExercisePR | null = null
  let prWithStraps: ExercisePR | null = null

  for (const p of all) {
    const baseName = p.gripName
      ? p.exerciseName
          .slice(
            0,
            Math.max(0, p.exerciseName.length - ` · ${p.gripName}`.length),
          )
          .trim()
      : p.exerciseName
    if (normalizeExerciseName(baseName) !== wantName) continue
    if ((p.gripName ?? '').trim().toLowerCase() !== wantGrip) continue
    if (p.withStraps) prWithStraps = p
    else pr = p
  }

  return { pr, prWithStraps }
}

/**
 * ¿La serie recién marcada rompe el PR histórico de esa máquina?
 * (excluye la sesión en curso; útil mid-entreno).
 */
export async function evaluateLiveSetPR(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
): Promise<SessionNewPR | null> {
  const ex = session.exercises.find((e) => e.id === exerciseLogId)
  const set = ex?.sets.find((s) => s.id === setId)
  if (!ex || !set || !set.completed) return null
  if (set.weight == null || set.reps == null) return null
  if (set.weight <= 0 || set.reps <= 0) return null

  const withStraps = Boolean(set.withStraps)
  const { pr, prWithStraps } = await getExercisePRsForName(
    ex.name,
    ex.activeGripName,
    session.id,
  )
  const prev = withStraps ? prWithStraps : pr
  const cand = { weight: set.weight, reps: set.reps, rir: set.rir }
  if (!isBetterPR(cand, prev)) return null

  return {
    exerciseName: exerciseLogPrLabel(ex),
    weight: cand.weight,
    reps: cand.reps,
    rir: cand.rir,
    withStraps: withStraps || undefined,
    previous: prev ? { weight: prev.weight, reps: prev.reps } : null,
  }
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
  /** Agarre si aplica (para listados) */
  gripName?: string
  weight: number
  reps: number
  /** RIR de la serie del PR (puede ser null si no se registró) */
  rir: number | null
  date: string
  sessionId: string
  /** true = PR con straps de agarre (espalda) */
  withStraps?: boolean
}

function normalizeExerciseName(name: string): string {
  return machineIdentityKey(name)
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

function prStorageKey(
  exerciseName: string,
  withStraps: boolean,
  gripName?: string | null,
): string {
  const grip = gripName?.trim().toLowerCase() || ''
  return `${normalizeExerciseName(exerciseName)}::${grip}::${withStraps ? 'straps' : 'free'}`
}

function exerciseLogPrLabel(ex: {
  name: string
  activeGripName?: string
}): string {
  const grip = ex.activeGripName?.trim()
  return grip ? `${ex.name} · ${grip}` : ex.name
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
      const keyBase = normalizeExerciseName(ex.name)
      if (!keyBase) continue
      const gripName = ex.activeGripName?.trim() || undefined
      for (const set of ex.sets) {
        if (!set.completed || set.weight == null || set.reps == null) continue
        if (set.weight <= 0 || set.reps <= 0) continue
        const withStraps = Boolean(set.withStraps)
        const key = prStorageKey(ex.name, withStraps, gripName)
        const prev = best.get(key) ?? null
        const cand = { weight: set.weight, reps: set.reps }
        if (!isBetterPR(cand, prev)) continue
        best.set(key, {
          exerciseName: exerciseLogPrLabel(ex),
          gripName,
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          date: session.date,
          sessionId: session.id,
          withStraps: withStraps || undefined,
        })
      }
    }
  }

  return [...best.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

function prBaseName(pr: ExercisePR): string {
  if (!pr.gripName) return pr.exerciseName
  const suffix = ` · ${pr.gripName}`
  if (!pr.exerciseName.endsWith(suffix)) return pr.exerciseName
  return pr.exerciseName.slice(0, -suffix.length).trim()
}

/** Máquina que el coach puede filtrar: rutina actual + usadas en entrenos. */
export interface CoachMachineSummary {
  name: string
  sessionCount: number
  lastDate: string
  lastDayLabel: string
  pr: ExercisePR | null
  prWithStraps: ExercisePR | null
  muscleGroups: string[]
  underMaintenance: boolean
}

/** Un entreno de una máquina (todas las series de ese día). */
export interface CoachMachineSession {
  sessionId: string
  date: string
  dayLabel: string
  muscleGroups: string[]
  name: string
  plannedName?: string
  activeGripName?: string
  note?: string
  status: ExerciseLog['status']
  sets: SetLog[]
}

/** Catálogo de máquinas con conteo de entrenos, músculo y mantenimiento. */
export async function listCoachMachines(): Promise<CoachMachineSummary[]> {
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .toArray()

  type Acc = {
    name: string
    sessionIds: Set<string>
    lastDate: string
    lastStartedAt: number
    lastDayLabel: string
    muscleGroups: Set<string>
  }
  const byKey = new Map<string, Acc>()
  const maintenanceByKey = new Map<string, boolean>()

  function addMuscles(acc: Acc, groups: string[] | undefined) {
    for (const group of groups ?? []) {
      const label = group.trim()
      if (label) acc.muscleGroups.add(label)
    }
  }

  function ensureAcc(key: string, name: string, dayLabel: string): Acc {
    const existing = byKey.get(key)
    if (existing) return existing
    const created: Acc = {
      name,
      sessionIds: new Set(),
      lastDate: '',
      lastStartedAt: 0,
      lastDayLabel: dayLabel,
      muscleGroups: new Set(),
    }
    byKey.set(key, created)
    return created
  }

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const key = normalizeExerciseName(ex.name)
      if (!key) continue
      const existing = byKey.get(key)
      const isNewer =
        !existing ||
        session.startedAt > existing.lastStartedAt ||
        (session.startedAt === existing.lastStartedAt &&
          session.date > existing.lastDate)
      if (!existing) {
        const acc: Acc = {
          name: ex.name,
          sessionIds: new Set([session.id]),
          lastDate: session.date,
          lastStartedAt: session.startedAt,
          lastDayLabel: session.dayLabel,
          muscleGroups: new Set(),
        }
        byKey.set(key, acc)
        continue
      }
      existing.sessionIds.add(session.id)
      if (isNewer) {
        existing.name = ex.name
        existing.lastDate = session.date
        existing.lastStartedAt = session.startedAt
        existing.lastDayLabel = session.dayLabel
      }
    }
  }

  const routine = await getActiveRoutine()
  if (routine) {
    for (const day of routine.days) {
      if (day.isRestDay) continue
      for (const ex of day.exercises) {
        const key = normalizeExerciseName(ex.name)
        if (!key) continue
        const acc = ensureAcc(key, ex.name, day.label)
        const tagged = sanitizeMuscleGroups(ex.muscleGroups)
        const machineGroups =
          tagged.length > 0
            ? tagged
            : day.muscleGroups.length === 1
              ? day.muscleGroups
              : []
        addMuscles(acc, machineGroups)
        if (ex.underMaintenance) maintenanceByKey.set(key, true)
        for (const alt of ex.alternatives ?? []) {
          const altKey = normalizeExerciseName(alt.name)
          if (!altKey) continue
          const altAcc = byKey.get(altKey)
          if (altAcc) addMuscles(altAcc, machineGroups)
        }
      }
    }
  }

  const prs = await getAllExercisePRs()
  const marksByKey = new Map<
    string,
    { pr: ExercisePR | null; prWithStraps: ExercisePR | null }
  >()
  for (const p of prs) {
    const key = normalizeExerciseName(prBaseName(p))
    const slot = marksByKey.get(key) ?? { pr: null, prWithStraps: null }
    if (p.withStraps) {
      if (!slot.prWithStraps || isBetterPR(p, slot.prWithStraps)) {
        slot.prWithStraps = p
      }
    } else if (!slot.pr || isBetterPR(p, slot.pr)) {
      slot.pr = p
    }
    marksByKey.set(key, slot)
  }

  return [...byKey.entries()]
    .map(([key, row]) => {
      const marks = marksByKey.get(key)
      return {
        name: row.name,
        sessionCount: row.sessionIds.size,
        lastDate: row.lastDate,
        lastDayLabel: row.lastDayLabel,
        pr: marks?.pr ?? null,
        prWithStraps: marks?.prWithStraps ?? null,
        muscleGroups: [...row.muscleGroups].sort((a, b) =>
          a.localeCompare(b, 'es'),
        ),
        underMaintenance: Boolean(maintenanceByKey.get(key)),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Historial completo de una máquina, más reciente primero. */
export async function getCoachMachineHistory(
  exerciseName: string,
): Promise<CoachMachineSession[]> {
  const want = normalizeExerciseName(exerciseName)
  if (!want) return []

  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .toArray()

  sessions.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.startedAt - a.startedAt
  })

  const results: CoachMachineSession[] = []
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (normalizeExerciseName(ex.name) !== want) continue
      results.push({
        sessionId: session.id,
        date: session.date,
        dayLabel: session.dayLabel,
        muscleGroups: session.muscleGroups,
        name: ex.name,
        plannedName: ex.plannedName,
        activeGripName: ex.activeGripName,
        note: ex.note,
        status: ex.status,
        sets: ex.sets,
      })
    }
  }
  return results
}

export interface SessionNewPR {
  exerciseName: string
  weight: number
  reps: number
  rir: number | null
  withStraps?: boolean
  /** null = primera marca registrada de ese ejercicio */
  previous: { weight: number; reps: number } | null
}

/** Detecta PRs nuevos de una sesión vs el historial (excluyendo esa sesión) */
export async function detectNewPRsInSession(
  session: WorkoutSession,
): Promise<SessionNewPR[]> {
  const prior = await getAllExercisePRs(session.id)
  const priorMap = new Map<string, ExercisePR>()
  for (const p of prior) {
    const baseName = p.gripName
      ? p.exerciseName
          .slice(0, Math.max(0, p.exerciseName.length - ` · ${p.gripName}`.length))
          .trim()
      : p.exerciseName
    priorMap.set(prStorageKey(baseName, Boolean(p.withStraps), p.gripName), p)
  }

  const found: SessionNewPR[] = []

  for (const ex of session.exercises) {
    const keyBase = normalizeExerciseName(ex.name)
    if (!keyBase) continue
    const gripName = ex.activeGripName?.trim() || undefined

    const strapModes = new Set<boolean>()
    for (const set of ex.sets) {
      if (!set.completed || set.weight == null || set.reps == null) continue
      if (set.weight <= 0 || set.reps <= 0) continue
      strapModes.add(Boolean(set.withStraps))
    }

    for (const withStraps of strapModes) {
      let bestInSession: {
        weight: number
        reps: number
        rir: number | null
      } | null = null

      for (const set of ex.sets) {
        if (!set.completed || set.weight == null || set.reps == null) continue
        if (set.weight <= 0 || set.reps <= 0) continue
        if (Boolean(set.withStraps) !== withStraps) continue
        const cand = { weight: set.weight, reps: set.reps, rir: set.rir }
        if (!isBetterPR(cand, bestInSession)) continue
        bestInSession = cand
      }

      if (!bestInSession) continue

      const prev =
        priorMap.get(prStorageKey(ex.name, withStraps, gripName)) ?? null
      if (!isBetterPR(bestInSession, prev)) continue

      found.push({
        exerciseName: exerciseLogPrLabel(ex),
        weight: bestInSession.weight,
        reps: bestInSession.reps,
        rir: bestInSession.rir,
        withStraps: withStraps || undefined,
        previous: prev
          ? { weight: prev.weight, reps: prev.reps }
          : null,
      })
    }
  }

  return found.sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

/**
 * Todos los ejercicios de la rutina activa + su PR si existe.
 */
export async function getRoutineExercisePRs(): Promise<
  Array<{
    exerciseName: string
    baseName: string
    gripName?: string
    dayLabels: string[]
    muscleGroups: string[]
    pr: ExercisePR | null
    prWithStraps: ExercisePR | null
    supportsStraps: boolean
  }>
> {
  const routine = await getActiveRoutine()
  const prs = await getAllExercisePRs()
  const prByKey = new Map<string, ExercisePR>()
  for (const p of prs) {
    const baseName = p.gripName
      ? p.exerciseName
          .slice(
            0,
            Math.max(0, p.exerciseName.length - ` · ${p.gripName}`.length),
          )
          .trim()
      : p.exerciseName
    prByKey.set(prStorageKey(baseName, Boolean(p.withStraps), p.gripName), p)
  }

  const byKey = new Map<
    string,
    {
      exerciseName: string
      baseName: string
      gripName?: string
      dayLabels: string[]
      muscleGroups: string[]
      pr: ExercisePR | null
      prWithStraps: ExercisePR | null
      supportsStraps: boolean
    }
  >()

  function addMuscles(target: string[], groups: string[]) {
    for (const group of groups) {
      if (!target.some((g) => g.toLowerCase() === group.toLowerCase())) {
        target.push(group)
      }
    }
  }

  function upsertEntry(
    exerciseName: string,
    dayLabel: string | null,
    supportsStraps: boolean,
    gripName?: string,
    muscleGroups: string[] = [],
  ) {
    const listKey = `${normalizeExerciseName(exerciseName)}::${(gripName ?? '').toLowerCase()}`
    if (!normalizeExerciseName(exerciseName)) return
    const label = gripName ? `${exerciseName} · ${gripName}` : exerciseName
    const existing = byKey.get(listKey)
    if (existing) {
      if (dayLabel && !existing.dayLabels.includes(dayLabel)) {
        existing.dayLabels.push(dayLabel)
      }
      if (supportsStraps) existing.supportsStraps = true
      addMuscles(existing.muscleGroups, muscleGroups)
      return
    }
    byKey.set(listKey, {
      exerciseName: label,
      baseName: exerciseName,
      gripName,
      dayLabels: dayLabel ? [dayLabel] : [],
      muscleGroups: [...muscleGroups],
      pr: prByKey.get(prStorageKey(exerciseName, false, gripName)) ?? null,
      prWithStraps: supportsStraps
        ? prByKey.get(prStorageKey(exerciseName, true, gripName)) ?? null
        : null,
      supportsStraps,
    })
  }

  if (routine) {
    for (const day of routine.days) {
      if (day.isRestDay) continue
      for (const ex of day.exercises) {
        const tagged = sanitizeMuscleGroups(ex.muscleGroups)
        const machineGroups =
          tagged.length > 0
            ? tagged
            : day.muscleGroups.length === 1
              ? [...day.muscleGroups]
              : []
        const supportsStraps = supportsStrapsTracking(ex.name, day.muscleGroups)
        upsertEntry(ex.name, day.label, supportsStraps, undefined, machineGroups)
        for (const grip of ex.grips ?? []) {
          upsertEntry(
            ex.name,
            day.label,
            supportsStraps,
            grip.name,
            machineGroups,
          )
        }
      }
    }
  }

  /** Incluye PRs de nombres que ya no están en rutina (historial viejo) */
  for (const pr of prs) {
    const baseName = pr.gripName
      ? pr.exerciseName
          .slice(
            0,
            Math.max(0, pr.exerciseName.length - ` · ${pr.gripName}`.length),
          )
          .trim()
      : pr.exerciseName
    const listKey = `${normalizeExerciseName(baseName)}::${(pr.gripName ?? '').toLowerCase()}`
    if (!byKey.has(listKey)) {
      byKey.set(listKey, {
        exerciseName: pr.exerciseName,
        baseName,
        gripName: pr.gripName,
        dayLabels: [],
        muscleGroups: [],
        pr: pr.withStraps ? null : pr,
        prWithStraps: pr.withStraps ? pr : null,
        supportsStraps: Boolean(pr.withStraps),
      })
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'es'),
  )
}

/**
 * Elimina una máquina por completo: historial, rutina e improvements.
 * No une con otra; desaparece de PR.
 */
export async function deleteExerciseEverywhere(
  exerciseName: string,
): Promise<{ sessionsUpdated: number; routineUpdated: boolean }> {
  const name = exerciseName.trim()
  if (!name) throw new Error('Falta el nombre de la máquina.')
  const key = normalizeExerciseName(name)

  let sessionsUpdated = 0
  const sessions = await db.sessions.toArray()
  await db.transaction('rw', db.sessions, async () => {
    for (const session of sessions) {
      const next = session.exercises.filter(
        (ex) => normalizeExerciseName(ex.name) !== key,
      )
      if (next.length === session.exercises.length) continue
      await db.sessions.put({ ...session, exercises: next })
      sessionsUpdated++
    }
  })

  let routineUpdated = false
  const routine = await getActiveRoutine()
  if (routine) {
    const days = routine.days.map((day) => ({
      ...day,
      exercises: day.exercises.filter(
        (ex) => normalizeExerciseName(ex.name) !== key,
      ),
    }))
    if (JSON.stringify(days) !== JSON.stringify(routine.days)) {
      await db.routines.put({
        ...routine,
        days,
        updatedAt: Date.now(),
      })
      routineUpdated = true
    }
  }

  const improvements = await db.improvements.toArray()
  await db.transaction('rw', db.improvements, async () => {
    for (const row of improvements) {
      if (normalizeExerciseName(row.exerciseName) !== key) continue
      await db.improvements.delete(row.id)
    }
  })

  return { sessionsUpdated, routineUpdated }
}

/**
 * Une dos nombres de máquina: el historial y la rutina del nombre "from"
 * pasan a "into". Así desaparece el duplicado en PR.
 */
export async function mergeExerciseNames(
  fromName: string,
  intoName: string,
): Promise<{ sessionsUpdated: number; routineUpdated: boolean }> {
  const from = fromName.trim()
  const into = intoName.trim()
  if (!from || !into) throw new Error('Faltan nombres para unir.')
  if (normalizeExerciseName(from) === normalizeExerciseName(into) && from === into) {
    throw new Error('Son el mismo nombre.')
  }

  const fromKey = normalizeExerciseName(from)
  let sessionsUpdated = 0

  const sessions = await db.sessions.toArray()
  await db.transaction('rw', db.sessions, async () => {
    for (const session of sessions) {
      let changed = false
      const exercises = session.exercises.map((ex) => {
        if (normalizeExerciseName(ex.name) !== fromKey) return ex
        changed = true
        return { ...ex, name: into }
      })
      if (!changed) continue
      await db.sessions.put({ ...session, exercises })
      sessionsUpdated++
    }
  })

  let routineUpdated = false
  const routine = await getActiveRoutine()
  if (routine) {
    const days = routine.days.map((day) => ({
      ...day,
      exercises: day.exercises.flatMap((ex) => {
        if (normalizeExerciseName(ex.name) !== fromKey) return [ex]
        // Si ya existe "into" en el mismo día, quita el duplicado
        const already = day.exercises.some(
          (o) =>
            o.id !== ex.id && normalizeExerciseName(o.name) === normalizeExerciseName(into),
        )
        if (already) return []
        return [{ ...ex, name: into }]
      }),
    }))
    const before = JSON.stringify(routine.days)
    const after = JSON.stringify(days)
    if (before !== after) {
      await db.routines.put({
        ...routine,
        days,
        updatedAt: Date.now(),
      })
      routineUpdated = true
    }
  }

  const improvements = await db.improvements.toArray()
  await db.transaction('rw', db.improvements, async () => {
    for (const row of improvements) {
      if (normalizeExerciseName(row.exerciseName) !== fromKey) continue
      await db.improvements.put({ ...row, exerciseName: into })
    }
  })

  return { sessionsUpdated, routineUpdated }
}

export type ExerciseProgressRange = '1m' | '3m' | 'all'

export interface ExerciseProgressPoint {
  date: string
  sessionId: string
  weight: number
  reps: number
  rir: number | null
  withStraps: boolean
  /** true si en esa fecha se igualó o superó el mejor peso visto hasta entonces */
  isRunningPr: boolean
}

export interface ExerciseProgressStats {
  baseName: string
  gripName?: string
  displayName: string
  withStraps: boolean
  points: ExerciseProgressPoint[]
  currentPr: ExerciseProgressPoint | null
  first: ExerciseProgressPoint | null
  deltaWeight: number | null
  sessionsCount: number
  trend: 'up' | 'flat' | 'down' | 'unknown'
}

function rangeStartIso(range: ExerciseProgressRange): string | null {
  if (range === 'all') return null
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - (range === '1m' ? 31 : 93))
  return d.toISOString().slice(0, 10)
}

type ProgressSessionSlice = {
  id: string
  date: string
  startedAt?: number
  exercises: Array<{
    name: string
    activeGripName?: string
    sets: Array<{
      completed: boolean
      weight: number | null
      reps: number | null
      rir: number | null
      withStraps?: boolean
    }>
  }>
}

/**
 * Historial de una máquina: mejor serie por sesión (peso; si empata, más reps).
 */
export function computeExerciseProgressStats(input: {
  baseName: string
  gripName?: string | null
  /** Si true, mezcla todos los agarres de esa máquina. */
  anyGrip?: boolean
  withStraps: boolean
  range?: ExerciseProgressRange
  sessions: ProgressSessionSlice[]
}): ExerciseProgressStats {
  const baseName = input.baseName.trim()
  const gripName = input.gripName?.trim() || undefined
  const displayName = gripName ? `${baseName} · ${gripName}` : baseName
  const range = input.range ?? '3m'
  const start = rangeStartIso(range)
  const wantKey = normalizeExerciseName(baseName)
  const wantGrip = (gripName ?? '').toLowerCase()

  const sessions = [...input.sessions]
  sessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.startedAt ?? 0) - (b.startedAt ?? 0)
  })

  const points: ExerciseProgressPoint[] = []
  let runningBest: { weight: number; reps: number } | null = null

  for (const session of sessions) {
    let bestInSession: {
      weight: number
      reps: number
      rir: number | null
    } | null = null

    for (const ex of session.exercises) {
      if (normalizeExerciseName(ex.name) !== wantKey) continue
      const grip = (ex.activeGripName?.trim() || '').toLowerCase()
      if (!input.anyGrip && grip !== wantGrip) continue

      for (const set of ex.sets) {
        if (!set.completed || set.weight == null || set.reps == null) continue
        if (set.weight <= 0 || set.reps <= 0) continue
        if (Boolean(set.withStraps) !== input.withStraps) continue
        const cand = { weight: set.weight, reps: set.reps, rir: set.rir }
        if (!isBetterPR(cand, bestInSession)) continue
        bestInSession = cand
      }
    }

    if (!bestInSession) continue

    const isRunningPr = isBetterPR(bestInSession, runningBest)
    if (isRunningPr) {
      runningBest = {
        weight: bestInSession.weight,
        reps: bestInSession.reps,
      }
    }

    if (start && session.date < start) continue

    points.push({
      date: session.date,
      sessionId: session.id,
      weight: bestInSession.weight,
      reps: bestInSession.reps,
      rir: bestInSession.rir,
      withStraps: input.withStraps,
      isRunningPr,
    })
  }

  const first = points[0] ?? null
  const currentPr =
    points.reduce<ExerciseProgressPoint | null>((best, p) => {
      if (!best) return p
      return isBetterPR(p, best) ? p : best
    }, null)

  const deltaWeight =
    first && currentPr ? currentPr.weight - first.weight : null

  let trend: ExerciseProgressStats['trend'] = 'unknown'
  if (points.length >= 3) {
    const mid = Math.floor(points.length / 2)
    const avg = (slice: ExerciseProgressPoint[]) =>
      slice.reduce((s, p) => s + p.weight, 0) / slice.length
    const early = avg(points.slice(0, mid))
    const late = avg(points.slice(mid))
    const diff = late - early
    if (Math.abs(diff) < 0.5) trend = 'flat'
    else trend = diff > 0 ? 'up' : 'down'
  } else if (points.length === 2 && deltaWeight != null) {
    if (Math.abs(deltaWeight) < 0.5) trend = 'flat'
    else trend = deltaWeight > 0 ? 'up' : 'down'
  }

  return {
    baseName,
    gripName,
    displayName,
    withStraps: input.withStraps,
    points,
    currentPr,
    first,
    deltaWeight,
    sessionsCount: points.length,
    trend,
  }
}

export async function getExerciseProgressHistory(input: {
  baseName: string
  gripName?: string | null
  anyGrip?: boolean
  withStraps: boolean
  range?: ExerciseProgressRange
}): Promise<ExerciseProgressStats> {
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .toArray()

  return computeExerciseProgressStats({
    ...input,
    sessions: sessions.map((session) => ({
      id: session.id,
      date: session.date,
      startedAt: session.startedAt,
      exercises: session.exercises,
    })),
  })
}

/** Misma curva de Focus, pero desde el historial ya incluido en el enlace coach. */
export function getExerciseProgressFromCoachHistory(
  history: CoachMachineSession[],
  input: {
    baseName: string
    withStraps: boolean
    range?: ExerciseProgressRange
  },
): ExerciseProgressStats {
  const bySession = new Map<string, ProgressSessionSlice>()
  for (const row of history) {
    const exercise = {
      name: input.baseName,
      activeGripName: row.activeGripName,
      sets: row.sets,
    }
    const existing = bySession.get(row.sessionId)
    if (existing) {
      existing.exercises.push(exercise)
      continue
    }
    bySession.set(row.sessionId, {
      id: row.sessionId,
      date: row.date,
      exercises: [exercise],
    })
  }

  return computeExerciseProgressStats({
    baseName: input.baseName,
    withStraps: input.withStraps,
    range: input.range,
    anyGrip: true,
    sessions: [...bySession.values()],
  })
}

/* ─── Caminadora (cardio aparte) ─── */

export interface TreadmillSessionInput {
  speedMph: number
  inclinePercent: number
  durationMinutes: number
  durationSeconds: number
  calories: number
  note?: string
  date?: string
}

export async function saveTreadmillSession(
  input: TreadmillSessionInput,
): Promise<TreadmillSession> {
  if (input.speedMph <= 0) throw new Error('Coloca la velocidad en mph.')
  if (input.inclinePercent < 0) throw new Error('La inclinación no puede ser negativa.')
  const totalSeconds = input.durationMinutes * 60 + input.durationSeconds
  if (totalSeconds <= 0) throw new Error('Coloca el tiempo (min y seg).')
  if (input.durationSeconds < 0 || input.durationSeconds > 59) {
    throw new Error('Los segundos deben estar entre 0 y 59.')
  }
  if (input.calories < 0) throw new Error('Las calorías no pueden ser negativas.')

  const session: TreadmillSession = {
    id: createId('treadmill'),
    date: input.date ?? todayISODate(),
    createdAt: Date.now(),
    speedMph: Math.round(input.speedMph * 10) / 10,
    inclinePercent: Math.round(input.inclinePercent * 10) / 10,
    durationMinutes: Math.floor(input.durationMinutes),
    durationSeconds: Math.floor(input.durationSeconds),
    calories: Math.round(input.calories),
    note: input.note?.trim() || undefined,
  }

  await db.treadmillSessions.add(session)
  return session
}

export async function listTreadmillSessions(
  limit = 30,
): Promise<TreadmillSession[]> {
  return db.treadmillSessions.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function getLatestTreadmillSession(): Promise<
  TreadmillSession | undefined
> {
  return db.treadmillSessions.orderBy('createdAt').reverse().first()
}
