/**
 * Golpe al romper el PR: vibración (Android / donde el navegador deje)
 * y un thump grave programado en el mismo gesto, que en iPhone se siente.
 */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function soundMuted() {
  return (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('mi-gym-pr-sound') === '0'
  )
}

function rumble(
  ctx: AudioContext,
  at: number,
  dur: number,
  freq: number,
  gain: number,
) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, at)
  osc.frequency.exponentialRampToValueAtTime(Math.max(32, freq * 0.55), at + dur)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

function vibrateHit() {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate([35, 45, 55, 40, 180])
    }
  } catch {
    /* iOS a veces expone vibrate y lo rechaza */
  }
}

/** Programa el golpe para cuando el número llega (rompiste el PR). */
export function schedulePrHitHaptic(delayMs: number): () => void {
  if (typeof window === 'undefined' || prefersReducedMotion()) {
    return () => {}
  }

  const delay = Math.max(0, delayMs)
  let ctx: AudioContext | null = null

  if (!soundMuted()) {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (AC) {
        ctx = new AC()
        void ctx.resume()
        const at = ctx.currentTime + delay / 1000
        rumble(ctx, at, 0.07, 88, 0.16)
        rumble(ctx, at + 0.09, 0.15, 54, 0.24)
      }
    } catch {
      /* audio bloqueado */
    }
  }

  const vibrateId = window.setTimeout(vibrateHit, delay)
  const closeId = window.setTimeout(() => {
    void ctx?.close().catch(() => {})
    ctx = null
  }, delay + 600)

  return () => {
    window.clearTimeout(vibrateId)
    window.clearTimeout(closeId)
    void ctx?.close().catch(() => {})
  }
}
