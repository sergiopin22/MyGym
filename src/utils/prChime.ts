/**
 * Chime de PR vía Web Audio (sin archivo).
 * Estilo arcade level-up: 3 notas + sparkle.
 * Solo tras gesto del usuario (marcar serie / botón probar).
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

    const tone = (
      freq: number,
      start: number,
      dur: number,
      gain: number,
      type: OscillatorType = 'square',
    ) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = type
      osc.frequency.value = freq
      filter.type = 'lowpass'
      filter.frequency.value = 3200
      g.gain.setValueAtTime(0.0001, now + start)
      g.gain.exponentialRampToValueAtTime(gain, now + start + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(filter)
      filter.connect(g)
      g.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.03)
    }

    // Whoosh corto (ruido filtrado) antes del hit
    const bufferSize = Math.floor(ctx.sampleRate * 0.12)
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuf
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 900
    noiseFilter.Q.value = 0.7
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.0001, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.05, now + 0.02)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.13)

    // Arcade level-up: C5 → E5 → G5 → C6 sparkle
    tone(523.25, 0.06, 0.11, 0.055, 'square')
    tone(659.25, 0.16, 0.11, 0.065, 'square')
    tone(783.99, 0.26, 0.14, 0.08, 'square')
    tone(1046.5, 0.36, 0.22, 0.045, 'triangle') // sparkle arriba

    window.setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 700)
  } catch {
    /* silencio si el navegador bloquea audio */
  }
}
