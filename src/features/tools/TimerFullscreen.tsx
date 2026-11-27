import type { ReactNode } from 'react'
import { formatRestClock, formatRestTargetLabel } from '../../utils/restTimer'

interface TimerFullscreenProps {
  phase: 'running' | 'done'
  elapsedSec: number
  targetSec: number
  title?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  footer?: ReactNode
}

/** Pantalla completa underground: negro, llamas, grano, stencil. */
export function TimerFullscreen({
  phase,
  elapsedSec,
  targetSec,
  title = 'Descanso',
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  footer,
}: TimerFullscreenProps) {
  const progress =
    targetSec > 0 ? Math.min(1, Math.max(0, elapsedSec / targetSec)) : 0
  const remaining = Math.max(0, targetSec - elapsedSec)
  const inFinalTicks = phase === 'running' && remaining <= 5 && remaining > 0
  const ring = 2 * Math.PI * 54
  const dash = ring * (1 - progress)
  const stamp =
    phase === 'done' ? 'ROUND OVER' : inFinalTicks ? 'LAST SECONDS' : 'UNDERGROUND'

  return (
    <div
      className={[
        'timer-fs',
        phase === 'done' ? 'timer-fs--done' : '',
        phase === 'running' ? 'timer-fs--running' : '',
        inFinalTicks ? 'timer-fs--final' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={
        phase === 'done'
          ? 'Tiempo terminado'
          : `${title} ${formatRestClock(elapsedSec)}`
      }
    >
      <div className="timer-fs__soot" aria-hidden />
      <div className="timer-fs__embers" aria-hidden />
      <div className="timer-fs__heat" aria-hidden />
      <div className="timer-fs__grain" aria-hidden />
      <div className="timer-fs__scan" aria-hidden />
      <div className="timer-fs__vignette" aria-hidden />

      <div className="timer-fs__flames" aria-hidden>
        <span className="timer-fs__flame timer-fs__flame--a" />
        <span className="timer-fs__flame timer-fs__flame--b" />
        <span className="timer-fs__flame timer-fs__flame--c" />
        <span className="timer-fs__flame timer-fs__flame--d" />
        <span className="timer-fs__flame timer-fs__flame--e" />
        <span className="timer-fs__flame timer-fs__flame--f" />
        <span className="timer-fs__flame timer-fs__flame--g" />
      </div>

      <div className="timer-fs__frame" aria-hidden>
        <span className="timer-fs__corner timer-fs__corner--tl" />
        <span className="timer-fs__corner timer-fs__corner--tr" />
        <span className="timer-fs__corner timer-fs__corner--bl" />
        <span className="timer-fs__corner timer-fs__corner--br" />
      </div>

      <p className="timer-fs__stamp" aria-hidden>
        {stamp}
      </p>

      <p className="timer-fs__kicker">
        {phase === 'done' ? 'GO' : title.toUpperCase()}
      </p>
      <p className="timer-fs__meta">
        REST // {formatRestTargetLabel(targetSec).toUpperCase()}
        {phase === 'running'
          ? ` // ${formatRestClock(remaining)} LEFT`
          : null}
      </p>

      <div className="timer-fs__stage">
        <div className="timer-fs__stage-glow" aria-hidden />
        <svg className="timer-fs__ring" viewBox="0 0 120 120" aria-hidden>
          <circle
            className="timer-fs__ring-track"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="timer-fs__ring-value"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="6"
            strokeDasharray={`${ring}`}
            strokeDashoffset={dash}
            strokeLinecap="butt"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <p className="timer-fs__clock" aria-live="polite">
          {phase === 'done' ? 'GO' : formatRestClock(elapsedSec)}
        </p>
      </div>

      <div className="timer-fs__actions">
        <button
          type="button"
          className="timer-fs__primary"
          onClick={onPrimary}
        >
          {primaryLabel.toUpperCase()}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className="timer-fs__secondary"
            onClick={onSecondary}
          >
            {secondaryLabel.toUpperCase()}
          </button>
        ) : null}
      </div>

      {footer ? <div className="timer-fs__footer">{footer}</div> : null}
    </div>
  )
}
