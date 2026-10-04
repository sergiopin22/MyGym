import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import { playPrChime } from '../../utils/prChime'
import { schedulePrHitHaptic } from '../../utils/prHaptic'
import { getPrCelebrationGif } from '../../db/prCelebrationGif'
import {
  prCelebrationCssVars,
  usePrCelebrationColors,
} from './prCelebrationColors'
import {
  displayPrKicker,
  displayPrTitle,
  prGifTheme,
  usePrCelebrationCopy,
} from './prCelebrationCopy'

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

function CutinMedia({
  src,
  mime,
  className,
  style,
  onReady,
}: {
  src: string
  mime: string
  className?: string
  style?: CSSProperties
  onReady?: (size: { width: number; height: number }) => void
}) {
  if (mime.startsWith('video/')) {
    return (
      <video
        className={className}
        style={style}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          const video = e.currentTarget
          if (video.videoWidth && onReady) {
            onReady({ width: video.videoWidth, height: video.videoHeight })
          }
        }}
      />
    )
  }
  return (
    <img
      className={className}
      style={style}
      src={src}
      alt=""
      decoding="async"
      onLoad={(e) => {
        const img = e.currentTarget
        if (img.naturalWidth && onReady) {
          onReady({ width: img.naturalWidth, height: img.naturalHeight })
        }
      }}
    />
  )
}

const SPARKS = Array.from({ length: 16 }, (_, i) => i)

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
  const colors = usePrCelebrationColors()
  const copy = usePrCelebrationCopy()
  const fromW = toDisplay(fromWeight) ?? fromWeight
  const toW = toDisplay(toWeight) ?? toWeight
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [weight, setWeight] = useState(fromW)
  const [reps, setReps] = useState(fromReps)
  const [phase, setPhase] = useState<'count' | 'done'>('count')
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [gifMime, setGifMime] = useState('image/gif')
  const [gifSize, setGifSize] = useState<{ width: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    let url: string | null = null
    let alive = true
    setGifUrl(null)
    setGifSize(null)
    void getPrCelebrationGif(prGifTheme(copy)).then((row) => {
      if (!alive || !row) return
      url = URL.createObjectURL(row.blob)
      setGifUrl(url)
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
      if (row.width && row.height) {
        setGifSize({ width: row.width, height: row.height })
      }
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [copy.gifTheme])

  useEffect(() => {
    if (playSound) playPrChime()

    if (prefersReducedMotion()) {
      const stopHaptic = schedulePrHitHaptic(0)
      setWeight(toW)
      setReps(toReps)
      setPhase('done')
      if (!stayOpen) {
        const t = window.setTimeout(() => onCloseRef.current(), 1800)
        return () => {
          stopHaptic()
          window.clearTimeout(t)
        }
      }
      return stopHaptic
    }

    const duration = 1200
    const stopHaptic = schedulePrHitHaptic(duration)
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
      autoClose = window.setTimeout(() => onCloseRef.current(), duration + 2600)
    }

    return () => {
      stopHaptic()
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

  const beforeText =
    fromWeight <= 0 && fromReps <= 0
      ? 'Primera marca'
      : `${fromW % 1 === 0 ? fromW : fromW.toFixed(1)} ${label} × ${fromReps}`

  return createPortal(
    <div
      className={[
        'pr-limit-pop',
        phase === 'done' ? 'pr-limit-pop--hit' : '',
        gifUrl ? 'pr-limit-pop--cutin' : '',
      ].join(' ')}
      style={prCelebrationCssVars(colors)}
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo récord personal"
      onClick={() => onCloseRef.current()}
    >
      <div className="pr-limit-pop__fx" aria-hidden>
        <div className="pr-limit-pop__bg" />
        <div className="pr-limit-pop__vignette" />
        <div className="pr-limit-pop__flash" />
        <div className="pr-limit-pop__mark">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <svg
          className="pr-limit-pop__bolts"
          viewBox="0 0 100 160"
          preserveAspectRatio="none"
        >
          <polyline
            className="pr-limit-pop__bolt pr-limit-pop__bolt--a"
            pathLength="100"
            points="18,0 24,28 12,28 30,72 16,72 42,160"
          />
          <polyline
            className="pr-limit-pop__bolt pr-limit-pop__bolt--b"
            pathLength="100"
            points="78,8 70,40 84,40 62,88 78,88 48,160"
          />
          <polyline
            className="pr-limit-pop__bolt pr-limit-pop__bolt--c"
            pathLength="100"
            points="50,0 46,36 58,36 40,86 54,86 36,160"
          />
        </svg>
        <div className="pr-limit-pop__sparks">
          {SPARKS.map((i) => (
            <span key={i} style={{ ['--spark' as string]: String(i) }} />
          ))}
        </div>
        {gifUrl && phase === 'done' ? (
          <CutinMedia
            className="pr-limit-pop__cutin-bleed"
            src={gifUrl}
            mime={gifMime}
          />
        ) : null}
      </div>

      <div
        className="pr-limit-pop__stage"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pr-limit-pop__kicker">
          {displayPrKicker(copy, phase)}
        </p>
        <h2 className="pr-limit-pop__title">{displayPrTitle(copy, phase)}</h2>

        {gifUrl && phase === 'done' ? (
          <div className="pr-limit-pop__cutin" aria-hidden>
            <div className="pr-limit-pop__cutin-frame">
              <CutinMedia
                src={gifUrl}
                mime={gifMime}
                onReady={setGifSize}
                style={
                  gifSize
                    ? {
                        maxWidth: `min(${gifSize.width}px, 100%)`,
                        maxHeight: `min(${gifSize.height}px, 36dvh)`,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        ) : null}

        <p className="pr-limit-pop__exercise">{exerciseName}</p>

        <p
          className={[
            'pr-limit-pop__nums',
            phase === 'done' ? 'pr-limit-pop__nums--hit' : '',
          ].join(' ')}
          aria-live="polite"
        >
          <span className="pr-limit-pop__block">
            <span className="pr-limit-pop__weight">{weightText}</span>
            <span className="pr-limit-pop__unit">{label}</span>
          </span>
          <span className="pr-limit-pop__times">×</span>
          <span className="pr-limit-pop__block">
            <span className="pr-limit-pop__reps">{repsText}</span>
            <span className="pr-limit-pop__unit">reps</span>
          </span>
        </p>
        <p className="pr-limit-pop__before">
          Antes: <strong>{beforeText}</strong>
        </p>

        <button
          type="button"
          className="pr-limit-pop__go"
          onClick={() => onCloseRef.current()}
        >
          Seguir
        </button>
      </div>
    </div>,
    document.body,
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
