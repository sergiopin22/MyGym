function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

const ARM_ONLY_FRAGMENTS = [
  'curl',
  'biceps',
  'bíceps',
  'predicador',
  'triceps',
  'tríceps',
  'extension',
  'extensión',
  'martillo',
  'concentracion',
  'concentración',
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
  if (ARM_ONLY_FRAGMENTS.some((f) => name.includes(normalize(f)))) return false
  if (BACK_EXERCISE_FRAGMENTS.some((f) => name.includes(normalize(f)))) {
    return true
  }

  return muscleGroups.length === 1
}

export function formatStrapsLabel(withStraps?: boolean): string {
  return withStraps ? 'con straps' : 'sin straps'
}

export function formatStrapsSuffix(withStraps?: boolean): string {
  return withStraps ? ' · straps' : ''
}
