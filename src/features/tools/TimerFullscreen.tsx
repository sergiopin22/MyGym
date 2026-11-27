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

/** Pantalla completa del temporizador (entreno o herramienta). */
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
      <div className="timer-fs__pulse" aria-hidden />

      <p className="timer-fs__kicker">
        {phase === 'done' ? 'Listo' : title}
      </p>
      <p className="timer-fs__meta">
        Meta {formatRestTargetLabel(targetSec)}
        {phase === 'running'
          ? ` · quedan ${formatRestClock(remaining)}`
          : null}
      </p>

      <div className="timer-fs__stage">
        <svg className="timer-fs__ring" viewBox="0 0 120 120" aria-hidden>
          <circle
            className="timer-fs__ring-track"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="timer-fs__ring-value"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${ring}`}
            strokeDashoffset={dash}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <p className="timer-fs__clock" aria-live="polite">
          {phase === 'done' ? '¡Ya!' : formatRestClock(elapsedSec)}
        </p>
      </div>

      <div className="timer-fs__actions">
        <button
          type="button"
          className="timer-fs__primary"
          onClick={onPrimary}
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className="timer-fs__secondary"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>

      {footer ? <div className="timer-fs__footer">{footer}</div> : null}
    </div>
  )
}
