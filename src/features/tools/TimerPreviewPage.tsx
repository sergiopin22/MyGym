import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { PageHeader } from '../../ui/PageHeader'
import {
  FINAL_TICK_SECONDS,
  formatRestTargetLabel,
  getTimerDesign,
  getTimerTone,
  isTimerSoundEnabled,
  playFinalTick,
  playTimerDoneAlarm,
  previewTimerTone,
  setTimerDesign,
  setTimerSoundEnabled,
  setTimerTone,
  stopTimerAlarm,
  unlockTimerAudio,
  TIMER_DESIGNS,
  TIMER_TONES,
  type TimerDesignId,
  type TimerToneId,
} from '../../utils/restTimer'
import { TimerFullscreen } from './TimerFullscreen'

const PREVIEW_PRESETS = [10, 15, 20] as const

type Phase = 'idle' | 'running' | 'done'

/**
 * Temporizador solo para preview: prueba tono, tick, alarma y pantalla completa
 * sin tocar la meta de descanso del entreno.
 */
export function TimerPreviewPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [targetSec, setTargetSec] = useState<(typeof PREVIEW_PRESETS)[number]>(10)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [tone, setTone] = useState<TimerToneId>(() => getTimerTone())
  const [design, setDesign] = useState<TimerDesignId>(() => getTimerDesign())
  const [soundOn, setSoundOn] = useState(() => isTimerSoundEnabled())
  const cuedRef = useRef(false)
  const lastTickSecRef = useRef<number | null>(null)

  useEffect(() => {
    if (phase !== 'running') return

    function tick() {
      const elapsed = Math.max(0, Date.now() - startedAt)
      setElapsedMs(elapsed)
      const elapsedSec = elapsed / 1000
      const remaining = Math.max(0, targetSec - elapsedSec)
      const remainFloor = Math.ceil(remaining)

      if (
        remaining > 0 &&
        remainFloor <= FINAL_TICK_SECONDS &&
        remainFloor >= 1 &&
        lastTickSecRef.current !== remainFloor
      ) {
        lastTickSecRef.current = remainFloor
        playFinalTick()
      }

      if (elapsed >= targetSec * 1000 && !cuedRef.current) {
        cuedRef.current = true
        playTimerDoneAlarm(tone)
        setPhase('done')
      }
    }

    tick()
    const id = window.setInterval(tick, 150)
    return () => window.clearInterval(id)
  }, [phase, startedAt, targetSec, tone])

  useEffect(() => () => stopTimerAlarm(), [])

  function startPreview() {
    stopTimerAlarm()
    void unlockTimerAudio()
    cuedRef.current = false
    lastTickSecRef.current = null
    setStartedAt(Date.now())
    setElapsedMs(0)
    setPhase('running')
  }

  function stopToIdle() {
    stopTimerAlarm()
    cuedRef.current = true
    lastTickSecRef.current = null
    setPhase('idle')
    setElapsedMs(0)
  }

  function acknowledgeDone() {
    stopTimerAlarm()
    cuedRef.current = true
    lastTickSecRef.current = null
    setPhase('idle')
    setElapsedMs(0)
  }

  function pickTone(next: TimerToneId) {
    setTone(setTimerTone(next))
  }

  function pickDesign(next: TimerDesignId) {
    setDesign(setTimerDesign(next))
  }

  function toggleSound() {
    const next = !soundOn
    setTimerSoundEnabled(next)
    setSoundOn(next)
    if (!next) stopTimerAlarm()
  }

  const elapsedSec = elapsedMs / 1000

  if (phase === 'running' || phase === 'done') {
    return (
      <TimerFullscreen
        phase={phase}
        elapsedSec={elapsedSec}
        targetSec={targetSec}
        design={design}
        title="Preview"
        primaryLabel={phase === 'done' ? 'Empezar serie' : 'Detener preview'}
        onPrimary={phase === 'done' ? acknowledgeDone : stopToIdle}
        secondaryLabel={phase === 'running' ? 'Cancelar' : undefined}
        onSecondary={phase === 'running' ? stopToIdle : undefined}
        footer={
          phase === 'done' ? (
            <p>Así se oye al terminar. Toca para callar la alarma.</p>
          ) : (
            <p>
              Preview · tick en los últimos {FINAL_TICK_SECONDS}s · no cambia tu
              meta de descanso
            </p>
          )
        }
      />
    )
  }

  return (
    <div className="standalone-timer space-y-5">
      <PageHeader
        kicker="Focus · Preview"
        title="Preview del timer"
        subtitle="Prueba pantalla completa, tick final y alarma sin esperar 3 min."
        back={
          <Link
            to="/temporizador"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Temporizador
          </Link>
        }
      />

      <div className="timer-preview-banner">
        <p className="timer-preview-banner__title">Modo prueba</p>
        <p className="timer-preview-banner__sub">
          No guarda la meta del entreno. Solo para escuchar y ver la animación.
        </p>
      </div>

      <div className="standalone-timer__card">
        <p className="standalone-timer__kicker">Duración preview</p>
        <p className="standalone-timer__clock" aria-live="polite">
          {formatRestTargetLabel(targetSec)}
        </p>
      </div>

      <div className="standalone-timer__presets">
        {PREVIEW_PRESETS.map((sec) => (
          <button
            key={sec}
            type="button"
            className={[
              'standalone-timer__preset',
              sec === targetSec ? 'standalone-timer__preset--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setTargetSec(sec)}
          >
            {sec}s
          </button>
        ))}
      </div>

      <div className="timer-setup">
        <p className="timer-setup__label">Diseño pantalla completa</p>
        <div className="timer-setup__designs">
          {TIMER_DESIGNS.map((row) => (
            <button
              key={row.id}
              type="button"
              className={[
                'timer-setup__design',
                design === row.id ? 'timer-setup__design--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => pickDesign(row.id)}
            >
              <strong>{row.label}</strong>
              <span>{row.tagline}</span>
            </button>
          ))}
        </div>
        <Link
          to="/temporizador/personalizar"
          className="timer-preview-link"
        >
          <span className="timer-preview-link__copy">
            <span className="timer-preview-link__title">
              Crear / editar mi diseño
            </span>
            <span className="timer-preview-link__sub">
              GIF, color, título, frases y estilo
            </span>
          </span>
          <span aria-hidden>→</span>
        </Link>

        <p className="timer-setup__label">Tono de alarma</p>
        <div className="timer-setup__tones">
          {TIMER_TONES.map((row) => (
            <button
              key={row.id}
              type="button"
              className={[
                'timer-setup__tone',
                tone === row.id ? 'timer-setup__tone--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => pickTone(row.id)}
            >
              {row.label}
            </button>
          ))}
          <button
            type="button"
            className="timer-setup__tone timer-setup__tone--preview"
            onClick={() => previewTimerTone(tone)}
          >
            Probar tono
          </button>
        </div>

        <button
          type="button"
          className={[
            'timer-setup__silence',
            soundOn ? '' : 'timer-setup__silence--on',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={toggleSound}
        >
          {soundOn
            ? 'Sonido activado · vibra + tono'
            : 'Silencio automático · solo vibra'}
        </button>
        {!soundOn ? (
          <p className="text-xs font-medium text-danger">
            El sonido está apagado. Actívalo arriba para oír la alarma.
          </p>
        ) : null}
      </div>

      <Button fullWidth onClick={startPreview}>
        Ver preview · {targetSec}s
      </Button>

      <Link
        to="/temporizador"
        className="block text-center text-sm font-semibold text-brand underline"
      >
        Ir al temporizador normal
      </Link>
    </div>
  )
}
