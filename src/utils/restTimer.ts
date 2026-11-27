/** Preferencia local: meta de descanso entre series (conteo desde 0). */

export const REST_SECONDS_KEY = 'mi-gym-rest-target-seconds'
export const TIMER_TONE_KEY = 'mi-gym-timer-tone'
export const TIMER_SOUND_KEY = 'mi-gym-timer-sound'
export const DEFAULT_REST_SECONDS = 180
export const MIN_REST_SECONDS = 15
export const MAX_REST_SECONDS = 600
export const REST_PRESETS = [120, 180, 240, 300] as const
export const FINAL_TICK_SECONDS = 5

export type TimerToneId = 'beep' | 'bell'

export const TIMER_TONES: Array<{ id: TimerToneId; label: string }> = [
  { id: 'beep', label: 'Beep' },
  { id: 'bell', label: 'Campana box' },
]

function clampRestSeconds(sec: number): number {
  if (!Number.isFinite(sec)) return DEFAULT_REST_SECONDS
  return Math.min(
    MAX_REST_SECONDS,
    Math.max(MIN_REST_SECONDS, Math.round(sec)),
  )
}

export function getRestSeconds(): number {
  try {
    const raw = localStorage.getItem(REST_SECONDS_KEY)
    if (!raw) return DEFAULT_REST_SECONDS
    return clampRestSeconds(Number(raw))
  } catch {
    return DEFAULT_REST_SECONDS
  }
}

export function setRestSeconds(sec: number): number {
  const next = clampRestSeconds(sec)
  try {
    localStorage.setItem(REST_SECONDS_KEY, String(next))
  } catch {
    /* private mode */
  }
  return next
}

export function getTimerTone(): TimerToneId {
  try {
    const raw = localStorage.getItem(TIMER_TONE_KEY)
    if (raw === 'bell' || raw === 'beep') return raw
  } catch {
    /* ignore */
  }
  return 'bell'
}

export function setTimerTone(tone: TimerToneId): TimerToneId {
  try {
    localStorage.setItem(TIMER_TONE_KEY, tone)
  } catch {
    /* private mode */
  }
  return tone
}

/** false = silencio automático (solo vibra). Respeta también el mute de PR. */
export function isTimerSoundEnabled(): boolean {
  try {
    if (localStorage.getItem(TIMER_SOUND_KEY) === '0') return false
    if (localStorage.getItem('mi-gym-pr-sound') === '0') return false
  } catch {
    /* ignore */
  }
  return true
}

export function setTimerSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(TIMER_SOUND_KEY, on ? '1' : '0')
  } catch {
    /* private mode */
  }
}

/** Reloj tipo 0:00 / 3:00 (segundos enteros hacia abajo o arriba). */
export function formatRestClock(
  totalSeconds: number,
  mode: 'up' | 'down' = 'up',
): string {
  const s =
    mode === 'up'
      ? Math.max(0, Math.floor(totalSeconds))
      : Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function formatRestTargetLabel(sec: number): string {
  if (sec % 60 === 0) {
    const min = sec / 60
    return min === 1 ? '1 min' : `${min} min`
  }
  return `${sec}s`
}

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as AudioWindow
  return w.AudioContext || w.webkitAudioContext || null
}

let sharedCtx: AudioContext | null = null
const pendingStops: Array<() => void> = []

function ensureCtx(): AudioContext | null {
  const AC = getAudioContextCtor()
  if (!AC) return null
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AC()
  }
  void sharedCtx.resume()
  return sharedCtx
}

function trackStop(fn: () => void) {
  pendingStops.push(fn)
}

/** Corta alarma / ticks al tocar “Empezar serie” u otro dismiss. */
export function stopTimerAlarm(): void {
  while (pendingStops.length) {
    const fn = pendingStops.pop()
    try {
      fn?.()
    } catch {
      /* ignore */
    }
  }
  if (sharedCtx && sharedCtx.state !== 'closed') {
    try {
      sharedCtx.suspend()
    } catch {
      /* ignore */
    }
  }
}

function vibratePattern(pattern: number | number[]) {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* iOS */
  }
}

function toneBeep(ctx: AudioContext, at: number, gain = 0.14) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, at)
  osc.frequency.exponentialRampToValueAtTime(520, at + 0.2)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + 0.32)
}

/** Campana de box aproximada (parciales metálicos). */
function toneBell(ctx: AudioContext, at: number, gain = 0.18) {
  const freqs = [520, 780, 1040]
  const gains = [gain, gain * 0.45, gain * 0.22]
  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = i === 0 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freqs[i]!, at)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gains[i]!, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.1)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 1.15)
  }
}

function toneTick(ctx: AudioContext, at: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1200, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.07, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + 0.09)
}

/** Tick de los últimos segundos (siempre vibra un toque; audio si no hay silencio). */
export function playFinalTick(): void {
  if (typeof window === 'undefined') return
  vibratePattern(18)
  if (!isTimerSoundEnabled()) return
  try {
    const ctx = ensureCtx()
    if (!ctx) return
    toneTick(ctx, ctx.currentTime)
  } catch {
    /* audio bloqueado */
  }
}

/**
 * Alarma al terminar. Se puede cortar con stopTimerAlarm()
 * (botón “Empezar serie”).
 */
export function playTimerDoneAlarm(tone: TimerToneId = getTimerTone()): void {
  if (typeof window === 'undefined') return

  stopTimerAlarm()
  vibratePattern([50, 80, 50, 80, 120])

  if (!isTimerSoundEnabled()) return

  try {
    const ctx = ensureCtx()
    if (!ctx) return
    void ctx.resume()

    let cancelled = false
    const timers: number[] = []
    trackStop(() => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
      try {
        navigator.vibrate?.(0)
      } catch {
        /* ignore */
      }
    })

    const playOnce = (whenMs: number) => {
      const id = window.setTimeout(() => {
        if (cancelled) return
        const at = ctx.currentTime
        if (tone === 'bell') toneBell(ctx, at)
        else {
          toneBeep(ctx, at)
          toneBeep(ctx, at + 0.22, 0.12)
        }
        vibratePattern(tone === 'bell' ? [40, 60, 100] : [35, 40, 35])
      }, whenMs)
      timers.push(id)
    }

    /* Repite un par de veces hasta que toquen Empezar serie */
    playOnce(0)
    playOnce(1400)
    playOnce(2800)
  } catch {
    /* audio bloqueado */
  }
}

/** Preview de tono (desde la UI de ajustes del timer). */
export function previewTimerTone(tone: TimerToneId): void {
  if (typeof window === 'undefined') return
  stopTimerAlarm()
  vibratePattern(30)
  if (!isTimerSoundEnabled()) return
  try {
    const ctx = ensureCtx()
    if (!ctx) return
    void ctx.resume()
    const at = ctx.currentTime
    if (tone === 'bell') toneBell(ctx, at, 0.16)
    else {
      toneBeep(ctx, at, 0.14)
      toneBeep(ctx, at + 0.2, 0.11)
    }
  } catch {
    /* ignore */
  }
}

/** @deprecated usar playTimerDoneAlarm */
export function playRestDoneCue(): void {
  playTimerDoneAlarm(getTimerTone())
}
