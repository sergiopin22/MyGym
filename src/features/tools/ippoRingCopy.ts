/** Copy del modo Ippo (Hajime no Ippo / Kamogawa Gym). */
export const IPPO_RING_QUOTES = [
  '¡El espíritu de lucha!',
  'Un round más',
  'Kamogawa Gym',
  'Demuestra tu fuerza',
  'Sigue adelante, Ippo',
  'Sin rendirse',
  'Al ring',
  'Fighting Spirit',
] as const

export function ippoRingQuote(elapsedSec: number): string {
  const idx = Math.floor(Math.max(0, elapsedSec) / 8) % IPPO_RING_QUOTES.length
  return IPPO_RING_QUOTES[idx] ?? IPPO_RING_QUOTES[0]
}

export function ippoRingStamp(
  phase: 'running' | 'done',
  final: boolean,
): string {
  if (phase === 'done') return 'BELL'
  if (final) return 'FINAL ROUND'
  return 'ROUND'
}
