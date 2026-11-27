/** Copy de Modo Guerra (temática Temach / gym / disciplina). */
export const TEMACH_WAR_QUOTES = [
  'Disciplina > motivación',
  'Mantente en tu carril',
  'Exhausto y victorioso',
  'Un día más en modo guerra',
  'Compas de hierro',
  'El gimnasio no miente',
  'Hoy también se entrena',
  'Constancia vence talento',
] as const

export function temachWarQuote(elapsedSec: number): string {
  const idx = Math.floor(Math.max(0, elapsedSec) / 8) % TEMACH_WAR_QUOTES.length
  return TEMACH_WAR_QUOTES[idx] ?? TEMACH_WAR_QUOTES[0]
}

export function temachWarStamp(
  phase: 'running' | 'done',
  final: boolean,
): string {
  if (phase === 'done') return 'VICTORIOSO'
  if (final) return 'DISCIPLINA'
  return 'MODO GUERRA'
}
