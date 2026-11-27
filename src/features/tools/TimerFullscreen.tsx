import type { ReactNode } from 'react'
import {
  formatRestClock,
  formatRestTargetLabel,
  getTimerDesign,
  type TimerDesignId,
} from '../../utils/restTimer'
import { TemachLogoMark } from './TemachLogoMark'

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
  design?: TimerDesignId
}

const DEBRIS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
] as const

function stampFor(design: TimerDesignId, phase: 'running' | 'done', final: boolean) {
  if (design === 'temach-logo') {
    if (phase === 'done') return 'GO'
    if (final) return 'FOCUS'
    return 'TEMACH'
  }
  if (design === 'temach') {
    if (phase === 'done') return 'TEMACH'
    if (final) return 'DISCIPLINA'
    return 'MODO GUERRA'
  }
  if (phase === 'done') return 'ENGAGE'
  if (final) return 'CRITICAL'
  return 'WAR MODE'
}

function doneLabel(design: TimerDesignId) {
  if (design === 'temach-logo') return 'GO'
  if (design === 'temach') return 'GUERRA'
  return 'ENGAGE'
}

function metaPrefix(design: TimerDesignId) {
  if (design === 'temach-logo' || design === 'temach') return 'TEMACH'
  return 'WAR'
}

/** Pantalla completa del timer: Temach logo, Temach guerra o campo de batalla. */
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
  design: designProp,
}: TimerFullscreenProps) {
  const design = designProp ?? getTimerDesign()
  const progress =
    targetSec > 0 ? Math.min(1, Math.max(0, elapsedSec / targetSec)) : 0
  const remaining = Math.max(0, targetSec - elapsedSec)
  const inFinalTicks = phase === 'running' && remaining <= 5 && remaining > 0
  const ring = 2 * Math.PI * 54
  const dash = ring * (1 - progress)
  const stamp = stampFor(design, phase, inFinalTicks)
  const showLogo = design === 'temach-logo'
  const showBattleFx = design !== 'temach-logo'

  return (
    <div
      className={[
        'timer-fs',
        `timer-fs--${design}`,
        phase === 'done' ? 'timer-fs--done' : '',
        phase === 'running' ? 'timer-fs--running' : '',
        inFinalTicks ? 'timer-fs--final' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-timer-design={design}
      role="dialog"
      aria-modal="true"
      aria-label={
        phase === 'done'
          ? 'Tiempo terminado'
          : `${title} ${formatRestClock(elapsedSec)}`
      }
    >
      <div className="timer-fs__soot" aria-hidden />
      {showBattleFx ? (
        <>
          <div className="timer-fs__embers" aria-hidden />
          <div className="timer-fs__heat" aria-hidden />
          <div className="timer-fs__mist" aria-hidden />
        </>
      ) : null}
      {showBattleFx ? (
        <>
          <div className="timer-fs__grain" aria-hidden />
          <div className="timer-fs__scan" aria-hidden />
        </>
      ) : null}
      <div className="timer-fs__vignette" aria-hidden />

      {showBattleFx ? (
        <>
          <div className="timer-fs__hazard" aria-hidden>
            <span className="timer-fs__hazard-band" />
            <span className="timer-fs__hazard-glow" />
          </div>
          <div className="timer-fs__ash" aria-hidden>
            {DEBRIS.map((id) => (
              <span
                key={id}
                className={`timer-fs__debris timer-fs__debris--${id}`}
              />
            ))}
          </div>
        </>
      ) : null}

      {showBattleFx ? (
        <div className="timer-fs__frame" aria-hidden>
          <span className="timer-fs__corner timer-fs__corner--tl" />
          <span className="timer-fs__corner timer-fs__corner--tr" />
          <span className="timer-fs__corner timer-fs__corner--bl" />
          <span className="timer-fs__corner timer-fs__corner--br" />
        </div>
      ) : null}

      {showBattleFx ? (
        <p className="timer-fs__stamp" aria-hidden>
          {stamp}
        </p>
      ) : null}

      {showLogo ? (
        <div className="timer-fs__logo-wash" aria-hidden>
          <TemachLogoMark showWord={false} />
        </div>
      ) : null}

      {showLogo ? (
        <div className="timer-fs__logo-slot">
          <TemachLogoMark />
        </div>
      ) : (
        <p className="timer-fs__kicker">
          {phase === 'done' ? doneLabel(design) : title.toUpperCase()}
        </p>
      )}

      <p className="timer-fs__meta">
        {showLogo
          ? `${title.toUpperCase()} · ${formatRestTargetLabel(targetSec).toUpperCase()}${
              phase === 'running'
                ? ` · ${formatRestClock(remaining)} LEFT`
                : ''
            }`
          : `${metaPrefix(design)} // ${formatRestTargetLabel(targetSec).toUpperCase()}${
              phase === 'running'
                ? ` // ${formatRestClock(remaining)} LEFT`
                : ''
            }`}
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
            strokeWidth="5"
          />
          <circle
            className="timer-fs__ring-value"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="5"
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
