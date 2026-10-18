/** Mismos chips que la rutina (Piernas / Hombros, en plural). */
export const MUSCLE_FILTERS = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'hombro', label: 'Hombros' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'pierna', label: 'Piernas' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'espalda', label: 'Espalda' },
] as const

export type MuscleFilterId = (typeof MUSCLE_FILTERS)[number]['id']

function foldMuscle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
}

/** En la rutina se guarda Hombros/Piernas; el filtro usaba hombro/pierna. */
const MUSCLE_CANONICAL: Record<string, MuscleFilterId> = {
  pecho: 'pecho',
  pechos: 'pecho',
  hombro: 'hombro',
  hombros: 'hombro',
  deltoides: 'hombro',
  triceps: 'triceps',
  biceps: 'biceps',
  pierna: 'pierna',
  piernas: 'pierna',
  cuadriceps: 'pierna',
  femoral: 'pierna',
  femorales: 'pierna',
  isquios: 'pierna',
  isquiotibiales: 'pierna',
  gluteo: 'pierna',
  gluteos: 'pierna',
  espalda: 'espalda',
}

function canonicalMuscle(token: string): string {
  return MUSCLE_CANONICAL[token] ?? token
}

export function muscleMatchesFilter(
  groups: string[] | undefined,
  filterId: string | null,
): boolean {
  if (!filterId) return true
  const want = canonicalMuscle(foldMuscle(filterId))
  if (!want) return true
  return (groups ?? []).some((group) => {
    const folded = foldMuscle(group)
    if (!folded) return false
    if (canonicalMuscle(folded) === want) return true
    return folded.split(' ').some((token) => canonicalMuscle(token) === want)
  })
}
