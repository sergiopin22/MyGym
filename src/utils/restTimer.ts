/** Preferencia local: meta de descanso entre series (conteo desde 0). */

export const REST_SECONDS_KEY = 'mi-gym-rest-target-seconds'
export const TIMER_TONE_KEY = 'mi-gym-timer-tone'
export const TIMER_SOUND_KEY = 'mi-gym-timer-sound'
export const TIMER_DESIGN_KEY = 'mi-gym-timer-design'
export const DEFAULT_REST_SECONDS = 180
export const MIN_REST_SECONDS = 15
export const MAX_REST_SECONDS = 600
export const REST_PRESETS = [120, 180, 240, 300] as const
export const FINAL_TICK_SECONDS = 5

export type TimerToneId = 'beep' | 'bell'
export type TimerDesignId =
  | 'custom'
  | 'ippo'
  | 'temach-logo'
  | 'temach'
  | 'war'

export const TIMER_TONES: Array<{ id: TimerToneId; label: string }> = [
  { id: 'beep', label: 'Beep' },
  { id: 'bell', label: 'Campana box' },
]

export const TIMER_DESIGNS: Array<{
  id: TimerDesignId
  label: string
  tagline: string
}> = [
  {
    id: 'custom',
    label: 'Mi diseño',
    tagline: 'GIF, colores y textos que tú eliges',
  },
  {
    id: 'ippo',
    label: 'Ippo',
    tagline: 'Kamogawa Gym · Makunouchi · espíritu de lucha',
  },
  {
    id: 'temach',
    label: 'Modo Guerra Temach',
    tagline: 'Ejército de los Compas · disciplina · logo',
  },
  {
    id: 'temach-logo',
    label: 'Temach Logo',
    tagline: 'Negro · logo blanco limpio',
  },
  {
    id: 'war',
    label: 'Campo de batalla',
    tagline: 'Hazard · escombros · bruma',
  },
]

export const DEFAULT_TIMER_DESIGN: TimerDesignId = 'ippo'

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

/** Solo el mute del timer (no el de PR). Por defecto: sonido ON. */
export function isTimerSoundEnabled(): boolean {
  try {
    if (localStorage.getItem(TIMER_SOUND_KEY) === '0') return false
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

export function isTimerDesignId(value: string): value is TimerDesignId {
  return (
    value === 'custom' ||
    value === 'ippo' ||
    value === 'temach-logo' ||
    value === 'temach' ||
    value === 'war'
  )
}

export function getTimerDesign(): TimerDesignId {
  try {
    // Preferir modo Ippo (GIF Makunouchi + Kamogawa).
    if (!localStorage.getItem('mi-gym-timer-design-ippo-v1')) {
      localStorage.setItem('mi-gym-timer-design-ippo-v1', '1')
      localStorage.setItem(TIMER_DESIGN_KEY, 'ippo')
      return 'ippo'
    }
    const raw = localStorage.getItem(TIMER_DESIGN_KEY)
    if (raw && isTimerDesignId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_TIMER_DESIGN
}

export function setTimerDesign(design: TimerDesignId): TimerDesignId {
  const next = isTimerDesignId(design) ? design : DEFAULT_TIMER_DESIGN
  try {
    localStorage.setItem(TIMER_DESIGN_KEY, next)
  } catch {
    /* private mode */
  }
  return next
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
const liveOscillators = new Set<OscillatorNode>()

function ensureCtx(): AudioContext | null {
  const AC = getAudioContextCtor()
  if (!AC) return null
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AC()
  }
  return sharedCtx
}

async function resumeCtx(ctx: AudioContext): Promise<boolean> {
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx.state === 'running'
  } catch {
    return false
  }
}

function trackStop(fn: () => void) {
  pendingStops.push(fn)
}

function trackOsc(osc: OscillatorNode) {
  liveOscillators.add(osc)
  osc.onended = () => {
    liveOscillators.delete(osc)
  }
}

/**
 * Hay que llamarlo en un click (Empezar / Preview / Descanso).
 * En iPhone sin esto el audio no suena al terminar el timer.
 */
export async function unlockTimerAudio(): Promise<void> {
  if (typeof window === 'undefined') return
  const ctx = ensureCtx()
  if (!ctx) return
  await resumeCtx(ctx)
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.value = 0.0001
    src.connect(g)
    g.connect(ctx.destination)
    src.start(0)
  } catch {
    /* ignore */
  }
}

/** Corta alarma / ticks al tocar “Empezar serie”. No suspende el AudioContext. */
export function stopTimerAlarm(): void {
  while (pendingStops.length) {
    const fn = pendingStops.pop()
    try {
      fn?.()
    } catch {
      /* ignore */
    }
  }
  for (const osc of [...liveOscillators]) {
    try {
      osc.stop()
    } catch {
      /* already stopped */
    }
    liveOscillators.delete(osc)
  }
  try {
    navigator.vibrate?.(0)
  } catch {
    /* ignore */
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

function rampGain(g: GainNode, at: number, peak: number, dur: number) {
  g.gain.cancelScheduledValues(at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(peak, at + Math.min(0.02, dur * 0.1))
  g.gain.linearRampToValueAtTime(0.0001, at + dur)
}

function toneBeep(ctx: AudioContext, at: number, gain = 0.22) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, at)
  osc.frequency.linearRampToValueAtTime(520, at + 0.22)
  rampGain(g, at, gain, 0.3)
  osc.connect(g)
  g.connect(ctx.destination)
  trackOsc(osc)
  osc.start(at)
  osc.stop(at + 0.35)
}

/** Campana de box aproximada (parciales metálicos). */
function toneBell(ctx: AudioContext, at: number, gain = 0.28) {
  const freqs = [520, 780, 1040]
  const gains = [gain, gain * 0.5, gain * 0.28]
  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = i === 0 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freqs[i]!, at)
    rampGain(g, at, gains[i]!, 1.05)
    osc.connect(g)
    g.connect(ctx.destination)
    trackOsc(osc)
    osc.start(at)
    osc.stop(at + 1.1)
  }
}

function toneTick(ctx: AudioContext, at: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1400, at)
  rampGain(g, at, 0.12, 0.08)
  osc.connect(g)
  g.connect(ctx.destination)
  trackOsc(osc)
  osc.start(at)
  osc.stop(at + 0.1)
}

async function withRunningCtx(
  play: (ctx: AudioContext) => void,
): Promise<void> {
  const ctx = ensureCtx()
  if (!ctx) return
  const ok = await resumeCtx(ctx)
  if (!ok) return
  play(ctx)
}

/** Tick de los últimos segundos. */
export function playFinalTick(): void {
  if (typeof window === 'undefined') return
  vibratePattern(25)
  if (!isTimerSoundEnabled()) return
  void withRunningCtx((ctx) => {
    toneTick(ctx, ctx.currentTime)
  })
}

/**
 * Alarma al terminar. Se corta con stopTimerAlarm()
 * (botón “Empezar serie”).
 */
export function playTimerDoneAlarm(tone: TimerToneId = getTimerTone()): void {
  if (typeof window === 'undefined') return

  stopTimerAlarm()
  vibratePattern([60, 80, 60, 80, 140])

  if (!isTimerSoundEnabled()) return

  void withRunningCtx((ctx) => {
    let cancelled = false
    const timers: number[] = []
    trackStop(() => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
    })

    const playOnce = (whenMs: number) => {
      const id = window.setTimeout(() => {
        if (cancelled) return
        void resumeCtx(ctx).then((ok) => {
          if (!ok || cancelled) return
          const at = ctx.currentTime
          if (tone === 'bell') toneBell(ctx, at)
          else {
            toneBeep(ctx, at)
            toneBeep(ctx, at + 0.2, 0.18)
          }
          vibratePattern(tone === 'bell' ? [50, 70, 120] : [40, 45, 40])
        })
      }, whenMs)
      timers.push(id)
    }

    playOnce(0)
    playOnce(1300)
    playOnce(2600)
  })
}

/** Preview de tono (desde un click → sí tiene gesto de usuario). */
export function previewTimerTone(tone: TimerToneId): void {
  if (typeof window === 'undefined') return
  stopTimerAlarm()
  vibratePattern(35)
  if (!isTimerSoundEnabled()) return
  void (async () => {
    await unlockTimerAudio()
    const ctx = ensureCtx()
    if (!ctx) return
    const at = ctx.currentTime
    if (tone === 'bell') toneBell(ctx, at, 0.26)
    else {
      toneBeep(ctx, at, 0.22)
      toneBeep(ctx, at + 0.2, 0.16)
    }
  })()
}

/** @deprecated usar playTimerDoneAlarm */
export function playRestDoneCue(): void {
  playTimerDoneAlarm(getTimerTone())
}
