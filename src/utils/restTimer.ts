/** Preferencia local: meta de descanso entre series (conteo desde 0). */

export const REST_SECONDS_KEY = 'mi-gym-rest-target-seconds'
export const DEFAULT_REST_SECONDS = 180
export const MIN_REST_SECONDS = 15
export const MAX_REST_SECONDS = 600
export const REST_PRESETS = [120, 180, 240, 300] as const

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

/** Reloj tipo 0:00 / 3:00 (segundos enteros hacia abajo o arriba). */
export function formatRestClock(totalSeconds: number, mode: 'up' | 'down' = 'up'): string {
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

function soundMuted() {
  return (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('mi-gym-pr-sound') === '0'
  )
}

/** Vibra + beep corto al llegar a la meta de descanso. */
export function playRestDoneCue(): void {
  if (typeof window === 'undefined') return

  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate([40, 60, 80])
    }
  } catch {
    /* iOS */
  }

  if (soundMuted()) return

  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    void ctx.resume()
    const at = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, at)
    osc.frequency.exponentialRampToValueAtTime(440, at + 0.18)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.25)
    window.setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 400)
  } catch {
    /* audio bloqueado */
  }
}
