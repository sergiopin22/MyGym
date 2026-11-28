import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { getTimerCustomGif } from '../../db/timerCustomSkin'
import {
  formatRestClock,
  formatRestTargetLabel,
  getTimerDesign,
  type TimerDesignId,
} from '../../utils/restTimer'
import { ippoRingQuote, ippoRingStamp } from './ippoRingCopy'
import { TemachLogoMark } from './TemachLogoMark'
import { temachWarQuote, temachWarStamp } from './temachWarCopy'
import {
  createEmptyCustomSkin,
  customSkinQuote,
  getActiveCustomSkin,
  type TimerCustomSkinMeta,
} from './timerCustomSkin'

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

const FALLBACK_CUSTOM: TimerCustomSkinMeta = {
  ...createEmptyCustomSkin(),
  id: '',
  updatedAt: 0,
}

function stampFor(
  design: TimerDesignId,
  phase: 'running' | 'done',
  final: boolean,
  custom?: TimerCustomSkinMeta | null,
) {
  if (design === 'custom') {
    if (phase === 'done') return custom?.doneText || 'GO'
    if (final) return 'CRITICAL'
    return custom?.stamp || 'ROUND'
  }
  if (design === 'ippo') return ippoRingStamp(phase, final)
  if (design === 'temach' || design === 'temach-logo') {
    return temachWarStamp(phase, final)
  }
  if (phase === 'done') return 'ENGAGE'
  if (final) return 'CRITICAL'
  return 'WAR MODE'
}

function doneLabel(design: TimerDesignId, custom?: TimerCustomSkinMeta | null) {
  if (design === 'ippo') return 'BELL'
  if (design === 'temach') return 'VICTORIOSO'
  if (design === 'temach-logo') return 'GO'
  if (design === 'custom') return custom?.doneText || 'GO'
  return 'ENGAGE'
}

function CustomMedia({
  url,
  mime,
  className,
}: {
  url: string
  mime: string
  className: string
}) {
  if (mime.startsWith('video/')) {
    return (
      <video
        className={className}
        src={url}
        muted
        loop
        autoPlay
        playsInline
      />
    )
  }
  return (
    <img
      className={className}
      src={url}
      alt=""
      draggable={false}
      decoding="async"
    />
  )
}

/** Pantalla completa del timer: custom, Ippo, Temach o campo de batalla. */
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
  const isCustom = design === 'custom'
  const isIppo = design === 'ippo'
  const isTemachWar = design === 'temach'
  const isTemachLogo = design === 'temach-logo'
  const showTemachLogo = isTemachWar || isTemachLogo
  const customSkin = isCustom
    ? (getActiveCustomSkin() ?? FALLBACK_CUSTOM)
    : null
  const stamp = stampFor(design, phase, inFinalTicks, customSkin)
  const layout = customSkin?.layout ?? 'classic'
  const mediaPos = customSkin?.mediaPos ?? 'top'
  const customAnim = customSkin?.anim ?? 'none'
  const showBattleFx =
    isTemachWar ||
    design === 'war' ||
    (isCustom && (customSkin?.scene === 'war' || layout === 'war'))
  const showRopes =
    isIppo ||
    (isCustom && (customSkin?.scene === 'ring' || layout === 'boxing'))
  const showFrameStamp =
    !isCustom
      ? showBattleFx || isIppo
      : layout !== 'minimal' && layout !== 'big'
  const showCustomFlash =
    isCustom && (customAnim === 'combo' || customAnim === 'glitch')
  const showCustomHead =
    isCustom && customSkin && layout !== 'minimal'
  const showRing = !isCustom || layout === 'classic' || layout === 'boxing' || layout === 'war' || layout === 'poster'
  const showBars = isCustom && layout === 'bars'
  const showBigClock = isCustom && (layout === 'big' || layout === 'minimal')
  const [customGifUrl, setCustomGifUrl] = useState<string | null>(null)
  const [customGifMime, setCustomGifMime] = useState('image/gif')

  useEffect(() => {
    if (!isCustom || !customSkin?.id) {
      setCustomGifUrl(null)
      return
    }
    let url: string | null = null
    let alive = true
    void getTimerCustomGif(customSkin.id).then((row) => {
      if (!alive) return
      if (!row) {
        setCustomGifUrl(null)
        return
      }
      url = URL.createObjectURL(row.blob)
      setCustomGifUrl(url)
      setCustomGifMime(row.mimeType || row.blob.type || 'image/gif')
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [isCustom, customSkin?.id])

  const warQuote =
    phase === 'done'
      ? 'Exhausto y victorioso'
      : inFinalTicks
        ? 'Disciplina > motivación'
        : temachWarQuote(elapsedSec)

  const ippoQuote =
    phase === 'done'
      ? '¡El espíritu de lucha!'
      : inFinalTicks
        ? 'Último round'
        : ippoRingQuote(elapsedSec)

  const customQuote = customSkin
    ? customSkinQuote(customSkin, elapsedSec, phase, inFinalTicks)
    : ''

  const clockText =
    phase === 'done'
      ? isCustom
        ? customSkin?.doneText || 'GO'
        : 'GO'
      : formatRestClock(elapsedSec)

  const customStyle =
    isCustom && customSkin
      ? ({
          '--timer-accent': customSkin.accent,
          '--timer-accent-2': customSkin.accentSecondary,
          '--timer-bg': customSkin.bgColor,
          '--timer-bg-2': customSkin.bgColor2,
          '--timer-overlay': `${customSkin.overlayIntensity / 100}`,
        } as CSSProperties)
      : undefined

  const showTopMedia =
    isCustom &&
    customGifUrl &&
    mediaPos === 'top' &&
    layout !== 'minimal'
  const showPosterMedia =
    isCustom && customGifUrl && (mediaPos === 'top' || mediaPos === 'background') && layout === 'poster'
  const showWatermark =
    isCustom && customGifUrl && mediaPos === 'watermark'
  const showBgMedia =
    isCustom && customGifUrl && mediaPos === 'background' && layout !== 'poster'

  return (
    <div
      className={[
        'timer-fs',
        `timer-fs--${design}`,
        isCustom && customSkin ? `timer-fs--custom-scene-${customSkin.scene}` : '',
        isCustom ? `timer-fs--custom-anim-${customAnim}` : '',
        isCustom ? `timer-fs--custom-layout-${layout}` : '',
        isCustom && customSkin ? `timer-fs--custom-font-${customSkin.font}` : '',
        isCustom && customSkin ? `timer-fs--custom-bg-${customSkin.bgMode}` : '',
        isCustom && customSkin
          ? `timer-fs--custom-overlay-${customSkin.overlay}`
          : '',
        isCustom ? `timer-fs--custom-media-${mediaPos}` : '',
        phase === 'done' ? 'timer-fs--done' : '',
        phase === 'running' ? 'timer-fs--running' : '',
        inFinalTicks ? 'timer-fs--final' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={customStyle}
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

      {showBgMedia && customGifUrl ? (
        <div className="timer-fs__custom-bg-media" aria-hidden>
          <CustomMedia
            url={customGifUrl}
            mime={customGifMime}
            className="timer-fs__custom-bg-media-el"
          />
        </div>
      ) : null}

      {showWatermark && customGifUrl ? (
        <div className="timer-fs__custom-watermark" aria-hidden>
          <CustomMedia
            url={customGifUrl}
            mime={customGifMime}
            className="timer-fs__custom-watermark-el"
          />
        </div>
      ) : null}

      {isCustom ? (
        <div className="timer-fs__custom-overlay-layer" aria-hidden />
      ) : null}

      {showBattleFx ? (
        <>
          <div className="timer-fs__embers" aria-hidden />
          <div className="timer-fs__heat" aria-hidden />
          <div className="timer-fs__mist" aria-hidden />
          <div className="timer-fs__grain" aria-hidden />
          <div className="timer-fs__scan" aria-hidden />
        </>
      ) : null}
      <div className="timer-fs__vignette" aria-hidden />
      {isTemachWar || showCustomFlash ? (
        <div className="timer-fs__war-flash" aria-hidden />
      ) : null}
      {isIppo ? <div className="timer-fs__ippo-flash" aria-hidden /> : null}

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

      {showRopes ? (
        <div className="timer-fs__ropes" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {showFrameStamp ? (
        <div className="timer-fs__frame" aria-hidden>
          <span className="timer-fs__corner timer-fs__corner--tl" />
          <span className="timer-fs__corner timer-fs__corner--tr" />
          <span className="timer-fs__corner timer-fs__corner--bl" />
          <span className="timer-fs__corner timer-fs__corner--br" />
        </div>
      ) : null}

      {showFrameStamp ? (
        <p className="timer-fs__stamp" aria-hidden>
          {stamp}
        </p>
      ) : null}

      {isTemachLogo ? (
        <div className="timer-fs__logo-wash" aria-hidden>
          <TemachLogoMark decorative className="timer-fs__logo-wash-img" />
        </div>
      ) : null}

      {showTemachLogo ? (
        <div
          className={
            isTemachWar
              ? 'timer-fs__logo-slot timer-fs__logo-slot--war'
              : 'timer-fs__logo-slot'
          }
        >
          <TemachLogoMark
            className={
              isTemachWar
                ? 'timer-fs__logo-main timer-fs__logo-main--war'
                : 'timer-fs__logo-main'
            }
          />
        </div>
      ) : null}

      {isIppo ? (
        <div className="timer-fs__ippo-gif-wrap">
          <img
            className="timer-fs__ippo-gif"
            src="/brand/ippo-makunouchi.gif"
            alt="Ippo Makunouchi"
            draggable={false}
            decoding="async"
          />
        </div>
      ) : null}

      {showPosterMedia && customGifUrl ? (
        <div className="timer-fs__custom-poster">
          <CustomMedia
            url={customGifUrl}
            mime={customGifMime}
            className="timer-fs__custom-poster-el"
          />
        </div>
      ) : null}

      {showTopMedia && !showPosterMedia && customGifUrl ? (
        <div className="timer-fs__custom-gif-wrap">
          <CustomMedia
            url={customGifUrl}
            mime={customGifMime}
            className="timer-fs__custom-gif"
          />
        </div>
      ) : null}

      {showCustomHead && customSkin ? (
        <div className="timer-fs__custom-head">
          <p className="timer-fs__custom-title">
            {phase === 'done' ? customSkin.doneText || 'GO' : customSkin.title}
          </p>
          {customSkin.subtitle ? (
            <p className="timer-fs__custom-sub">{customSkin.subtitle}</p>
          ) : null}
          {layout !== 'big' ? (
            <p
              key={customQuote}
              className="timer-fs__custom-quote"
              aria-live="polite"
            >
              {customQuote}
            </p>
          ) : null}
        </div>
      ) : isIppo ? (
        <div className="timer-fs__ippo-head">
          <p className="timer-fs__ippo-title">
            {phase === 'done' ? 'BELL' : 'IPPO'}
          </p>
          <p className="timer-fs__ippo-gym">KAMOGAWA BOXING GYM</p>
          <p
            key={ippoQuote}
            className="timer-fs__ippo-quote"
            aria-live="polite"
          >
            {ippoQuote}
          </p>
        </div>
      ) : isTemachWar ? (
        <div className="timer-fs__war-head">
          <p className="timer-fs__war-title">MODO GUERRA</p>
          <p className="timer-fs__war-army">EJÉRCITO DE LOS COMPAS</p>
          <p
            key={warQuote}
            className="timer-fs__war-quote"
            aria-live="polite"
          >
            {warQuote}
          </p>
        </div>
      ) : !isTemachLogo && !isCustom ? (
        <p className="timer-fs__kicker">
          {phase === 'done' ? doneLabel(design, customSkin) : title.toUpperCase()}
        </p>
      ) : null}

      {!(isCustom && layout === 'minimal') ? (
        <p className="timer-fs__meta">
          {isCustom
            ? `${(customSkin?.name ?? 'CUSTOM').toUpperCase()} · ${title.toUpperCase()} · ${formatRestTargetLabel(targetSec).toUpperCase()}${
                phase === 'running'
                  ? ` · ${formatRestClock(remaining)} LEFT`
                  : ''
              }`
            : isIppo
              ? `ROUND · ${title.toUpperCase()} · ${formatRestTargetLabel(targetSec).toUpperCase()}${
                  phase === 'running'
                    ? ` · ${formatRestClock(remaining)} LEFT`
                    : ''
                }`
              : isTemachWar
                ? `COMPA · ${title.toUpperCase()} · ${formatRestTargetLabel(targetSec).toUpperCase()}${
                    phase === 'running'
                      ? ` · ${formatRestClock(remaining)} LEFT`
                      : ''
                  }`
                : isTemachLogo
                  ? `${title.toUpperCase()} · ${formatRestTargetLabel(targetSec).toUpperCase()}${
                      phase === 'running'
                        ? ` · ${formatRestClock(remaining)} LEFT`
                        : ''
                    }`
                  : `WAR // ${formatRestTargetLabel(targetSec).toUpperCase()}${
                      phase === 'running'
                        ? ` // ${formatRestClock(remaining)} LEFT`
                        : ''
                    }`}
        </p>
      ) : null}

      {showBars ? (
        <div className="timer-fs__bars-wrap">
          <p className="timer-fs__clock timer-fs__clock--bars" aria-live="polite">
            {clockText}
          </p>
          <div className="timer-fs__bar" aria-hidden>
            <div
              className="timer-fs__bar-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          className={[
            'timer-fs__stage',
            showBigClock ? 'timer-fs__stage--big' : '',
            !showRing ? 'timer-fs__stage--norng' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="timer-fs__stage-glow" aria-hidden />
          {showRing ? (
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
          ) : null}
          <p className="timer-fs__clock" aria-live="polite">
            {clockText}
          </p>
        </div>
      )}

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
