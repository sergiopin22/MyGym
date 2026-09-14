import { useEffect, useRef, useState } from 'react'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import { playPrChime } from '../../utils/prChime'

export interface PrCountUpPayload {
  exerciseName: string
  /** Peso anterior en lb (canónico) */
  fromWeight: number
  /** Peso nuevo en lb */
  toWeight: number
  fromReps: number
  toReps: number
}

interface PrCountUpPopProps extends PrCountUpPayload {
  onClose: () => void
  /** Si true, no cierra solo (útil para mirar con calma). Default: auto-cierra. */
  stayOpen?: boolean
  /** Sonido corto al abrir. Default true. */
  playSound?: boolean
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Overlay: el número sube del PR anterior al nuevo. */
export function PrCountUpPop({
  exerciseName,
  fromWeight,
  toWeight,
  fromReps,
  toReps,
  onClose,
  stayOpen = false,
  playSound = true,
}: PrCountUpPopProps) {
  const { toDisplay, label } = useWeightUnit()
  const fromW = toDisplay(fromWeight) ?? fromWeight
  const toW = toDisplay(toWeight) ?? toWeight
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [weight, setWeight] = useState(fromW)
  const [reps, setReps] = useState(fromReps)
  const [phase, setPhase] = useState<'count' | 'done'>('count')

  useEffect(() => {
    if (playSound) playPrChime()

    if (prefersReducedMotion()) {
      setWeight(toW)
      setReps(toReps)
      setPhase('done')
      if (!stayOpen) {
        const t = window.setTimeout(() => onCloseRef.current(), 1800)
        return () => window.clearTimeout(t)
      }
      return
    }

    const duration = 1200
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = easeOutCubic(t)
      setWeight(fromW + (toW - fromW) * e)
      setReps(fromReps + (toReps - fromReps) * e)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setWeight(toW)
        setReps(toReps)
        setPhase('done')
      }
    }

    raf = requestAnimationFrame(tick)

    let autoClose: number | undefined
    if (!stayOpen) {
      autoClose = window.setTimeout(() => onCloseRef.current(), duration + 1600)
    }

    return () => {
      cancelAnimationFrame(raf)
      if (autoClose) window.clearTimeout(autoClose)
    }
  }, [fromW, toW, fromReps, toReps, stayOpen, playSound])

  const weightText =
    Math.abs(toW - fromW) >= 1
      ? weight.toFixed(weight % 1 === 0 && phase === 'done' ? 0 : 1)
      : String(Math.round(toW * 10) / 10)

  const repsText =
    phase === 'done' || fromReps === toReps
      ? String(Math.round(reps))
      : reps.toFixed(1)

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-overlay px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo récord personal"
      onClick={() => onCloseRef.current()}
    >
      <div
        className="pr-count-pop w-full max-w-sm rounded-3xl bg-surface-elevated p-6 text-center shadow-xl ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pr-count-pop__trophy mx-auto mb-2 text-5xl" aria-hidden>
          <span className="pr-pop-glow">🏆</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
          {phase === 'done' ? '¡Nuevo PR!' : 'Rompiendo marca…'}
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold text-fg">
          {exerciseName}
        </h2>

        <div className="pr-count-pop__stage mt-5 rounded-2xl bg-surface px-4 py-5 ring-1 ring-brand/30">
          <p
            className={[
              'font-display text-4xl font-black tabular-nums tracking-tight text-fg',
              phase === 'done' ? 'pr-count-pop__hit' : '',
            ].join(' ')}
            aria-live="polite"
          >
            {weightText}
            <span className="ml-1 text-lg font-bold text-muted">{label}</span>
            <span className="mx-1.5 text-2xl text-muted">×</span>
            {repsText}
            <span className="ml-1 text-lg font-bold text-muted">reps</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            Antes:{' '}
            <span className="font-semibold text-fg">
              {fromWeight <= 0 && fromReps <= 0
                ? 'Primera marca'
                : `${fromW % 1 === 0 ? fromW : fromW.toFixed(1)} ${label} × ${fromReps}`}
            </span>
          </p>
        </div>

        <button
          type="button"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-accent-fg transition active:scale-[0.98]"
          onClick={() => onCloseRef.current()}
        >
          Seguir
        </button>
      </div>
    </div>
  )
}

export function sessionNewPrToCountUp(pr: {
  exerciseName: string
  weight: number
  reps: number
  previous: { weight: number; reps: number } | null
}): PrCountUpPayload {
  return {
    exerciseName: pr.exerciseName,
    fromWeight: pr.previous?.weight ?? 0,
    toWeight: pr.weight,
    fromReps: pr.previous?.reps ?? 0,
    toReps: pr.reps,
  }
}
