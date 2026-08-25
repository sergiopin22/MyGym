import type { BodyCheckIn } from '../types'

/** Mensaje de medidas para enviar al coach */
export function formatBodyCheckInForCoach(checkIn: BodyCheckIn): string {
  const dateLabel = new Date(checkIn.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines = [
    '📸 Mi Gym — Check-in físico',
    `📅 ${dateLabel}`,
    '',
    '──────────────────',
    `⚖️ Peso: ${checkIn.weightLb} lb`,
    `💪 Bíceps: ${checkIn.bicepsCm} cm`,
    `🧍 Pecho: ${checkIn.chestCm} cm`,
    `📏 Cintura: ${checkIn.waistCm} cm`,
    `🦵 Muslo: ${checkIn.thighCm} cm`,
  ]

  if (checkIn.note?.trim()) {
    lines.push('', `📝 ${checkIn.note.trim()}`)
  }

  lines.push(
    '──────────────────',
    '(Fotos: frente, lado y espalda — adjúntalas en el chat)',
  )

  return lines.join('\n')
}

export function formatBodyComparisonForCoach(
  first: BodyCheckIn,
  latest: BodyCheckIn,
): string {
  function delta(a: number, b: number, unit: string) {
    const d = Math.round((b - a) * 10) / 10
    const sign = d > 0 ? '+' : ''
    return `${sign}${d} ${unit}`
  }

  const firstLabel = new Date(first.date + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const latestLabel = new Date(latest.date + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return [
    '📊 Mi Gym — Comparación física',
    `Inicio: ${firstLabel} → Último: ${latestLabel}`,
    '',
    '──────────────────',
    `⚖️ Peso: ${first.weightLb} → ${latest.weightLb} lb (${delta(first.weightLb, latest.weightLb, 'lb')})`,
    `💪 Bíceps: ${first.bicepsCm} → ${latest.bicepsCm} cm (${delta(first.bicepsCm, latest.bicepsCm, 'cm')})`,
    `🧍 Pecho: ${first.chestCm} → ${latest.chestCm} cm (${delta(first.chestCm, latest.chestCm, 'cm')})`,
    `📏 Cintura: ${first.waistCm} → ${latest.waistCm} cm (${delta(first.waistCm, latest.waistCm, 'cm')})`,
    `🦵 Muslo: ${first.thighCm} → ${latest.thighCm} cm (${delta(first.thighCm, latest.thighCm, 'cm')})`,
  ].join('\n')
}
