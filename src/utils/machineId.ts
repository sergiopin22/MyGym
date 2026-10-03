import type {
  ExerciseAlternative,
  ExerciseLog,
  Routine,
  RoutineExercise,
} from '../types'
import { createId } from './id'
import { machineIdentityKey } from './machineName'

export function newMachineId(): string {
  return createId('mac')
}

export function nameKey(name: string): string {
  return machineIdentityKey(name)
}

/** Clave de PR: id si existe, si no el nombre (entrenos viejos). */
export function prMachineKey(ex: { name: string; machineId?: string }): string {
  if (ex.machineId) return `id:${ex.machineId}`
  const key = nameKey(ex.name)
  return key ? `name:${key}` : ''
}

export function sameMachineLog(
  log: Pick<ExerciseLog, 'name' | 'machineId'>,
  want: { name: string; machineId?: string | null },
): boolean {
  if (want.machineId && log.machineId) return want.machineId === log.machineId
  return nameKey(log.name) === nameKey(want.name)
}

export function officialMachineIdForName(
  routine: Routine,
  name: string,
): string | undefined {
  const key = nameKey(name)
  if (!key) return undefined
  for (const day of routine.days) {
    for (const ex of day.exercises) {
      if (ex.machineId && nameKey(ex.name) === key) return ex.machineId
    }
  }
  return undefined
}

export function alternativeMachineIdForName(
  routine: Routine,
  officialName: string,
  altName: string,
): string | undefined {
  const official = nameKey(officialName)
  const alt = nameKey(altName)
  if (!official || !alt) return undefined
  for (const day of routine.days) {
    for (const ex of day.exercises) {
      if (nameKey(ex.name) !== official) continue
      const found = (ex.alternatives ?? []).find(
        (a) => a.machineId && nameKey(a.name) === alt,
      )
      if (found?.machineId) return found.machineId
    }
  }
  return undefined
}

/** Mapa nombre normalizado → machineId (oficiales y alternativas). */
export function machineIdsByName(routine: Routine): Map<string, string> {
  const map = new Map<string, string>()
  for (const day of routine.days) {
    for (const ex of day.exercises) {
      const ok = nameKey(ex.name)
      if (ex.machineId && ok && !map.has(ok)) map.set(ok, ex.machineId)
      for (const alt of ex.alternatives ?? []) {
        const ak = nameKey(alt.name)
        if (alt.machineId && ak && !map.has(ak)) map.set(ak, alt.machineId)
      }
    }
  }
  return map
}

/**
 * Asigna machineId a huecos de rutina que aún no lo tienen.
 * El mismo nombre (oficial o alternativa) reutiliza el mismo id.
 */
export function ensureRoutineMachineIds(routine: Routine): {
  routine: Routine
  changed: boolean
} {
  const officialByName = new Map<string, string>()
  const altByPair = new Map<string, string>()

  for (const day of routine.days) {
    for (const ex of day.exercises) {
      const ok = nameKey(ex.name)
      if (ex.machineId && ok && !officialByName.has(ok)) {
        officialByName.set(ok, ex.machineId)
      }
      for (const alt of ex.alternatives ?? []) {
        const ak = nameKey(alt.name)
        if (!alt.machineId || !ok || !ak) continue
        const pair = `${ok}::${ak}`
        if (!altByPair.has(pair)) altByPair.set(pair, alt.machineId)
      }
    }
  }

  let changed = false
  const days = routine.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      const ok = nameKey(ex.name)
      let machineId = ex.machineId
      if (!machineId && ok) {
        machineId = officialByName.get(ok) ?? newMachineId()
        officialByName.set(ok, machineId)
        changed = true
      }

      const alternatives: ExerciseAlternative[] = (ex.alternatives ?? []).map(
        (alt) => {
          if (alt.machineId) return alt
          const ak = nameKey(alt.name)
          const pair = `${ok}::${ak}`
          const id =
            (ak ? altByPair.get(pair) : undefined) ?? newMachineId()
          if (ak) altByPair.set(pair, id)
          changed = true
          return { ...alt, machineId: id }
        },
      )

      if (machineId === ex.machineId && alternatives.every((a, i) => a === (ex.alternatives ?? [])[i])) {
        return ex
      }

      const next: RoutineExercise = {
        ...ex,
        machineId,
        alternatives: alternatives.length ? alternatives : ex.alternatives,
      }
      return next
    }),
  }))

  return changed ? { routine: { ...routine, days }, changed: true } : { routine, changed: false }
}
