/**
 * Chime corto de PR vía Web Audio (sin archivo).
 * Solo funciona tras un gesto del usuario (marcar serie = OK en iOS).
 */
export function playPrChime(): void {
  try {
    const muted =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('mi-gym-pr-sound') === '0'
    if (muted) return

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return

    const ctx = new AC()
    const now = ctx.currentTime

    const beep = (freq: number, start: number, dur: number, gain = 0.08) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now + start)
      g.gain.exponentialRampToValueAtTime(gain, now + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    }

    // Dos tonos ascendentes (~0.35 s)
    beep(523.25, 0, 0.14, 0.07) // C5
    beep(783.99, 0.12, 0.2, 0.09) // G5

    window.setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 500)
  } catch {
    /* silencio si el navegador bloquea audio */
  }
}
