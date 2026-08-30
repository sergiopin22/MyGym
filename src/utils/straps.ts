function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Aislamientos de brazo en un día de espalda (no usan straps de agarre) */
const ARM_ONLY_FRAGMENTS = [
  'curl',
  'biceps',
  'bíceps',
  'predicador',
  'triceps',
  'tríceps',
  'martillo',
  'concentracion',
  'concentración',
  'extension de triceps',
  'extensión de tríceps',
  'extension de tríceps',
  'extensión de triceps',
  'triceps extension',
  'tríceps extension',
]

const BACK_EXERCISE_FRAGMENTS = [
  'jalon',
  'jalón',
  'remo',
  'pull',
  'dominada',
  'lat ',
  'lats',
  'dorsal',
  'row',
  'peso muerto',
  'deadlift',
  'rack pull',
  'face pull',
  'pullover',
  'hiperextension',
  'hiperextensión',
  'espalda',
]

export function supportsStrapsTracking(
  exerciseName: string,
  muscleGroups: string[],
): boolean {
  const hasBackDay = muscleGroups.some((g) => normalize(g) === 'espalda')
  if (!hasBackDay) return false

  const name = normalize(exerciseName)
  // Espalda primero: "hiperextension" no debe caer en "extension" de brazos
  if (BACK_EXERCISE_FRAGMENTS.some((f) => name.includes(normalize(f)))) {
    return true
  }
  if (ARM_ONLY_FRAGMENTS.some((f) => name.includes(normalize(f)))) {
    return false
  }

  return muscleGroups.length === 1
}

export function formatStrapsLabel(withStraps?: boolean): string {
  return withStraps ? 'con straps' : 'sin straps'
}

export function formatStrapsSuffix(withStraps?: boolean): string {
  return withStraps ? ' · straps' : ''
}
