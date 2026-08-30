import type { TreadmillSession } from '../types'

export function formatTreadmillDuration(
  minutes: number,
  seconds: number,
): string {
  const m = Math.max(0, Math.floor(minutes))
  const s = Math.max(0, Math.floor(seconds))
  if (s === 0) return `${m} min`
  return `${m} min ${s} s`
}

export function formatTreadmillSummary(session: TreadmillSession): string {
  const parts = [
    `${session.speedMph} mph`,
    `${session.inclinePercent}% incl.`,
    formatTreadmillDuration(session.durationMinutes, session.durationSeconds),
    `${session.calories} kcal`,
  ]
  return parts.join(' · ')
}
