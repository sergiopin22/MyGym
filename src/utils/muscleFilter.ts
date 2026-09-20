import { machineIdentityKey } from './machineName'

/** Mismos filtros que la vista coach. */
export const MUSCLE_FILTERS = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'hombro', label: 'Hombro' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'pierna', label: 'Pierna' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'espalda', label: 'Espalda' },
] as const

export type MuscleFilterId = (typeof MUSCLE_FILTERS)[number]['id']

export function muscleMatchesFilter(
  groups: string[] | undefined,
  filterId: string | null,
): boolean {
  if (!filterId) return true
  return (groups ?? []).some((group) => {
    const n = machineIdentityKey(group)
    return n === filterId || n.startsWith(filterId)
  })
}
