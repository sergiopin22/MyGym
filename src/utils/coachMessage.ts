import type { WorkoutSession } from '../types'
import { formatDuration } from './id'

function formatSetLine(set: {
  setNumber: number
  weight: number | null
  reps: number | null
  rir: number | null
  completed: boolean
}): string | null {
  if (!set.completed && set.weight == null && set.reps == null) return null

  const weight = set.weight != null ? `${set.weight} kg` : '— kg'
  const reps = set.reps != null ? `${set.reps} reps` : '— reps'
  const rir = set.rir != null ? ` · RIR ${set.rir}` : ''
  const note = set.completed ? '' : ' (no completada)'

  return `  Serie ${set.setNumber}: ${weight} × ${reps}${rir}${note}`
}

/** Texto listo para WhatsApp / coach */
export function formatWorkoutForCoach(session: WorkoutSession): string {
  const dateLabel = new Date(session.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines: string[] = [
    '🏋️ Mi Gym — Entrenamiento',
    `📅 ${dateLabel}`,
    `📋 ${session.dayLabel}`,
  ]

  if (session.muscleGroups.length > 0) {
    lines.push(`💪 ${session.muscleGroups.join(' · ')}`)
  }

  if (session.durationMs != null && session.durationMs > 0) {
    lines.push(`⏱ Duración: ${formatDuration(session.durationMs)}`)
  }

  lines.push('', '──────────────────', '')

  const exercises = [...session.exercises].sort((a, b) => a.order - b.order)
  let exerciseBlocks = 0

  for (const ex of exercises) {
    const setLines = ex.sets
      .map(formatSetLine)
      .filter((line): line is string => line !== null)
    const note = ex.note?.trim()

    if (setLines.length === 0 && !note) continue

    exerciseBlocks++
    lines.push(ex.name)
    lines.push(...setLines)
    if (note) {
      lines.push(`  📝 ${note}`)
    }
    lines.push('')
  }

  if (exerciseBlocks === 0) {
    lines.push('(Sin series registradas en esta sesión)')
    lines.push('')
  }

  const completedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  )
  const completedExercises = session.exercises.filter((e) => e.status === 'completed').length

  lines.push(
    '──────────────────',
    `Total: ${completedExercises} ejercicio${completedExercises === 1 ? '' : 's'} · ${completedSets} serie${completedSets === 1 ? '' : 's'} completada${completedSets === 1 ? '' : 's'}`,
  )

  return lines.join('\n')
}
