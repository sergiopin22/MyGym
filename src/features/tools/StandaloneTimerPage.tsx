import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { PageHeader } from '../../ui/PageHeader'
import {
  FINAL_TICK_SECONDS,
  formatRestTargetLabel,
  getRestSeconds,
  getTimerDesign,
  getTimerTone,
  isTimerSoundEnabled,
  playFinalTick,
  playTimerDoneAlarm,
  previewTimerTone,
  REST_PRESETS,
  setRestSeconds,
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

type Phase = 'idle' | 'running' | 'done'

/**
 * Temporizador suelto (menú). No depende de marcar series en el entreno.
 */
export function StandaloneTimerPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [targetSec, setTargetSec] = useState(() => getRestSeconds())
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
        playFinalTick(remainFloor, tone)
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

  function start() {
    stopTimerAlarm()
    void unlockTimerAudio()
    cuedRef.current = false
    lastTickSecRef.current = null
    const saved = setRestSeconds(targetSec)
    setTargetSec(saved)
    setStartedAt(Date.now())
    setElapsedMs(0)
    setPhase('running')
  }

  function stopToIdle() {
    stopTimerAlarm()
    cuedRef.current = true
    setPhase('idle')
    setElapsedMs(0)
    lastTickSecRef.current = null
  }

  function acknowledgeDone() {
    stopTimerAlarm()
    cuedRef.current = true
    setPhase('idle')
    setElapsedMs(0)
    lastTickSecRef.current = null
  }

  function pickPreset(sec: number) {
    const saved = setRestSeconds(sec)
    setTargetSec(saved)
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
        title="Temporizador"
        primaryLabel={
          phase === 'done' ? 'Empezar serie' : 'Detener'
        }
        onPrimary={phase === 'done' ? acknowledgeDone : stopToIdle}
        secondaryLabel={phase === 'running' ? 'Cancelar' : undefined}
        onSecondary={phase === 'running' ? stopToIdle : undefined}
        footer={
          phase === 'done' ? (
            <p>Toca para callar la alarma y seguir.</p>
          ) : (
            <p>
              Últimos {FINAL_TICK_SECONDS}s · pack{' '}
              {TIMER_TONES.find((t) => t.id === tone)?.label ?? tone}
            </p>
          )
        }
      />
    )
  }

  return (
    <div className="standalone-timer space-y-5">
      <PageHeader
        kicker="Focus · Tools"
        title="Temporizador"
        subtitle="Pantalla completa al arrancar. Independiente del entreno."
        back={
          <Link
            to="/"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Inicio
          </Link>
        }
      />

      <div className="standalone-timer__card">
        <p className="standalone-timer__kicker">Meta</p>
        <p className="standalone-timer__clock" aria-live="polite">
          {formatRestTargetLabel(targetSec)}
        </p>
      </div>

      <div className="standalone-timer__presets">
        {REST_PRESETS.map((sec) => (
          <button
            key={sec}
            type="button"
            className={[
              'standalone-timer__preset',
              sec === targetSec ? 'standalone-timer__preset--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => pickPreset(sec)}
          >
            {formatRestTargetLabel(sec)}
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
        <p className="timer-setup__label">Sonido (tick + alarma)</p>
        <div className="timer-setup__designs">
          {TIMER_TONES.map((row) => (
            <button
              key={row.id}
              type="button"
              className={[
                'timer-setup__design',
                tone === row.id ? 'timer-setup__design--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => pickTone(row.id)}
            >
              <strong>{row.label}</strong>
              <span>{row.tagline}</span>
            </button>
          ))}
        </div>
        <div className="timer-setup__tones">
          <button
            type="button"
            className="timer-setup__tone timer-setup__tone--preview"
            onClick={() => previewTimerTone(tone)}
          >
            Probar pack
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
            El sonido está apagado. Actívalo arriba o prueba el tono.
          </p>
        ) : null}
      </div>

      <Button fullWidth onClick={start}>
        Empezar · {formatRestTargetLabel(targetSec)}
      </Button>

      <Link to="/temporizador/preview" className="timer-preview-link">
        <span className="timer-preview-link__copy">
          <span className="timer-preview-link__title">Preview del timer</span>
          <span className="timer-preview-link__sub">
            Prueba 10–20 s a pantalla completa (tick + alarma)
          </span>
        </span>
        <span aria-hidden>→</span>
      </Link>

      <p className="text-center text-xs text-muted">
        Al terminar: tick final + alarma. “Empezar serie” corta el sonido.
      </p>
    </div>
  )
}
