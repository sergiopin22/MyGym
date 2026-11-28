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

export type TimerToneId = 'focus' | 'box' | 'guerra' | 'impulso'
export type TimerDesignId = 'ippo' | 'temach' | 'temach-logo' | 'classic'

export const TIMER_TONES: Array<{
  id: TimerToneId
  label: string
  tagline: string
}> = [
  {
    id: 'focus',
    label: 'Focus',
    tagline: 'Arpegio mayor · fanfarria GO',
  },
  {
    id: 'box',
    label: 'Box',
    tagline: 'Corner tap · campana de round',
  },
  {
    id: 'guerra',
    label: 'Guerra',
    tagline: 'Stomp urgente · cuerno de guerra',
  },
  {
    id: 'impulso',
    label: 'Impulso',
    tagline: 'Quintas energéticas · GO doble',
  },
]

export const DEFAULT_TIMER_TONE: TimerToneId = 'focus'

export const TIMER_DESIGNS: Array<{
  id: TimerDesignId
  label: string
  tagline: string
}> = [
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
    id: 'classic',
    label: 'Clásico',
    tagline: 'Focus · anillo limpio · gym dark',
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

function isTimerToneId(value: string): value is TimerToneId {
  return (
    value === 'focus' ||
    value === 'box' ||
    value === 'guerra' ||
    value === 'impulso'
  )
}

export function getTimerTone(): TimerToneId {
  try {
    const raw = localStorage.getItem(TIMER_TONE_KEY)
    if (raw === 'bell') return 'box'
    if (raw === 'beep') return 'focus'
    if (raw === 'suave') return 'impulso'
    if (raw && isTimerToneId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_TIMER_TONE
}

export function setTimerTone(tone: TimerToneId): TimerToneId {
  const next = isTimerToneId(tone) ? tone : DEFAULT_TIMER_TONE
  try {
    localStorage.setItem(TIMER_TONE_KEY, next)
  } catch {
    /* private mode */
  }
  return next
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
    value === 'ippo' ||
    value === 'temach-logo' ||
    value === 'temach' ||
    value === 'classic'
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
    // Migrar diseños retirados (custom / campo de batalla).
    if (raw === 'custom' || raw === 'war') {
      localStorage.setItem(TIMER_DESIGN_KEY, 'classic')
      localStorage.removeItem('mi-gym-timer-custom-skins')
      localStorage.removeItem('mi-gym-timer-custom-active')
      return 'classic'
    }
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

function blip(
  ctx: AudioContext,
  at: number,
  {
    freq,
    type = 'sine',
    gain = 0.2,
    dur = 0.12,
    slideTo,
  }: {
    freq: number
    type?: OscillatorType
    gain?: number
    dur?: number
    slideTo?: number
  },
) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (slideTo != null) {
    osc.frequency.linearRampToValueAtTime(slideTo, at + dur * 0.85)
  }
  rampGain(g, at, gain, dur)
  osc.connect(g)
  g.connect(ctx.destination)
  trackOsc(osc)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

/** Nota con armónicos (suena más “musical” / motivador). */
function note(
  ctx: AudioContext,
  at: number,
  freq: number,
  {
    gain = 0.2,
    dur = 0.22,
    type = 'triangle' as OscillatorType,
  }: { gain?: number; dur?: number; type?: OscillatorType } = {},
) {
  blip(ctx, at, { freq, type, gain, dur })
  blip(ctx, at, {
    freq: freq * 2,
    type: 'sine',
    gain: gain * 0.28,
    dur: dur * 0.85,
  })
}

/** Campana de round más gruesa (parciales + decay largo). */
function toneBell(ctx: AudioContext, at: number, gain = 0.32) {
  const partials: Array<[number, number, OscillatorType]> = [
    [523.25, gain, 'triangle'],
    [784.0, gain * 0.55, 'sine'],
    [1046.5, gain * 0.32, 'sine'],
    [1568.0, gain * 0.16, 'sine'],
  ]
  for (const [freq, gPeak, type] of partials) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.linearRampToValueAtTime(gPeak, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.35)
    osc.connect(g)
    g.connect(ctx.destination)
    trackOsc(osc)
    osc.start(at)
    osc.stop(at + 1.4)
  }
}

/** Fanfarria corta mayor (C–E–G–C): sensación de victoria / GO. */
function toneFanfare(ctx: AudioContext, at: number) {
  const freqs = [523.25, 659.25, 783.99, 1046.5]
  freqs.forEach((freq, i) => {
    note(ctx, at + i * 0.09, freq, {
      gain: 0.2 + i * 0.02,
      dur: 0.2 + i * 0.04,
      type: i === 3 ? 'sine' : 'triangle',
    })
  })
}

/** Cuerno / blast motivador (quinta + octava). */
function toneWarHorn(ctx: AudioContext, at: number) {
  blip(ctx, at, {
    freq: 220,
    type: 'sawtooth',
    gain: 0.16,
    dur: 0.45,
    slideTo: 330,
  })
  blip(ctx, at + 0.05, {
    freq: 330,
    type: 'square',
    gain: 0.12,
    dur: 0.4,
    slideTo: 440,
  })
  note(ctx, at + 0.35, 660, { gain: 0.22, dur: 0.28, type: 'triangle' })
  note(ctx, at + 0.48, 880, { gain: 0.18, dur: 0.35, type: 'sine' })
}

/** Doble GO energético (quinta). */
function tonePowerGo(ctx: AudioContext, at: number) {
  note(ctx, at, 392, { gain: 0.22, dur: 0.18, type: 'triangle' })
  note(ctx, at + 0.12, 587.33, { gain: 0.24, dur: 0.22, type: 'triangle' })
  note(ctx, at + 0.28, 784, { gain: 0.2, dur: 0.35, type: 'sine' })
  blip(ctx, at + 0.28, {
    freq: 1175,
    type: 'sine',
    gain: 0.1,
    dur: 0.25,
  })
}

function toneTickForPack(
  ctx: AudioContext,
  at: number,
  pack: TimerToneId,
  remainSec: number,
) {
  const step = Math.min(5, Math.max(1, Math.round(remainSec)))
  const urgency = 5 - step // 0..4

  if (pack === 'box') {
    // Corner tap: click + armónico agudo
    blip(ctx, at, { freq: 180, type: 'square', gain: 0.08, dur: 0.04 })
    blip(ctx, at, {
      freq: 980 + urgency * 40,
      type: 'triangle',
      gain: 0.16,
      dur: 0.08,
    })
    return
  }

  if (pack === 'guerra') {
    // Stomp + rising bite
    blip(ctx, at, { freq: 90 + urgency * 8, type: 'sawtooth', gain: 0.14, dur: 0.08 })
    blip(ctx, at + 0.03, {
      freq: 620 + urgency * 120,
      type: 'square',
      gain: 0.12 + urgency * 0.015,
      dur: 0.1,
      slideTo: 720 + urgency * 120,
    })
    return
  }

  if (pack === 'impulso') {
    // Quintas que suben: te empujan
    const root = 330 + urgency * 55
    note(ctx, at, root, { gain: 0.14, dur: 0.12, type: 'triangle' })
    note(ctx, at + 0.05, root * 1.5, { gain: 0.12, dur: 0.14, type: 'sine' })
    return
  }

  // Focus: arpegio mayor fragmentado (más brillante cada segundo)
  const chord = [523.25, 659.25, 783.99, 1046.5]
  const idx = Math.min(chord.length - 1, urgency)
  note(ctx, at, chord[idx]!, {
    gain: 0.15 + urgency * 0.02,
    dur: 0.14,
    type: 'triangle',
  })
  if (urgency >= 3) {
    note(ctx, at + 0.06, chord[Math.min(idx + 1, chord.length - 1)]!, {
      gain: 0.12,
      dur: 0.12,
      type: 'sine',
    })
  }
}

function toneAlarmForPack(ctx: AudioContext, at: number, pack: TimerToneId) {
  if (pack === 'box') {
    toneBell(ctx, at, 0.34)
    toneBell(ctx, at + 0.55, 0.22)
    return
  }
  if (pack === 'guerra') {
    toneWarHorn(ctx, at)
    return
  }
  if (pack === 'impulso') {
    tonePowerGo(ctx, at)
    return
  }
  toneFanfare(ctx, at)
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

/** Tick de los últimos segundos (remainSec = 5..1). */
export function playFinalTick(
  remainSec = 5,
  tone: TimerToneId = getTimerTone(),
): void {
  if (typeof window === 'undefined') return
  const step = Math.min(5, Math.max(1, Math.round(remainSec)))
  vibratePattern(tone === 'guerra' ? 40 : tone === 'impulso' ? 28 : 25)
  if (!isTimerSoundEnabled()) return
  void withRunningCtx((ctx) => {
    toneTickForPack(ctx, ctx.currentTime, tone, step)
  })
}

/**
 * Alarma al terminar. Se corta con stopTimerAlarm()
 * (botón “Empezar serie”).
 */
export function playTimerDoneAlarm(tone: TimerToneId = getTimerTone()): void {
  if (typeof window === 'undefined') return

  stopTimerAlarm()
  vibratePattern(
    tone === 'box'
      ? [50, 70, 120, 60, 160]
      : tone === 'guerra'
        ? [80, 40, 80, 40, 180]
        : tone === 'impulso'
          ? [55, 50, 55, 50, 140]
          : [50, 60, 50, 60, 150],
  )

  if (!isTimerSoundEnabled()) return

  void withRunningCtx((ctx) => {
    let cancelled = false
    const timers: number[] = []
    trackStop(() => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
    })

    // Una o dos vueltas potentes (no spam eterno).
    const repeats =
      tone === 'box' || tone === 'guerra' ? [0, 1500] : [0, 1300]

    for (const whenMs of repeats) {
      const id = window.setTimeout(() => {
        if (cancelled) return
        void resumeCtx(ctx).then((ok) => {
          if (!ok || cancelled) return
          toneAlarmForPack(ctx, ctx.currentTime, tone)
          vibratePattern(
            tone === 'box'
              ? [50, 70, 140]
              : tone === 'guerra'
                ? [70, 40, 90]
                : [45, 40, 70],
          )
        })
      }, whenMs)
      timers.push(id)
    }
  })
}

/** Preview de pack (ticks + alarma) desde un click. */
export function previewTimerTone(tone: TimerToneId): void {
  if (typeof window === 'undefined') return
  stopTimerAlarm()
  vibratePattern(35)
  if (!isTimerSoundEnabled()) return
  void (async () => {
    await unlockTimerAudio()
    const ctx = ensureCtx()
    if (!ctx) return
    const t0 = ctx.currentTime
    toneTickForPack(ctx, t0, tone, 5)
    toneTickForPack(ctx, t0 + 0.28, tone, 3)
    toneTickForPack(ctx, t0 + 0.55, tone, 1)
    window.setTimeout(() => {
      void resumeCtx(ctx).then((ok) => {
        if (!ok) return
        toneAlarmForPack(ctx, ctx.currentTime, tone)
      })
    }, 900)
  })()
}

/** @deprecated usar playTimerDoneAlarm */
export function playRestDoneCue(): void {
  playTimerDoneAlarm(getTimerTone())
}
