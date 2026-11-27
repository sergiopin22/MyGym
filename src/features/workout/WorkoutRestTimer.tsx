import { useEffect, useRef, useState } from 'react'
import {
  FINAL_TICK_SECONDS,
  formatRestTargetLabel,
  getRestSeconds,
  getTimerTone,
  playFinalTick,
  playTimerDoneAlarm,
  REST_PRESETS,
  setRestSeconds,
  stopTimerAlarm,
  unlockTimerAudio,
} from '../../utils/restTimer'
import { TimerFullscreen } from '../tools/TimerFullscreen'

interface WorkoutRestTimerProps {
  /** Cada vez que sube (serie marcada), ofrece el botón de descanso. */
  offerToken: number
}

type Phase = 'idle' | 'offer' | 'running' | 'done'

export function WorkoutRestTimer({ offerToken }: WorkoutRestTimerProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [targetSec, setTargetSec] = useState(() => getRestSeconds())
  const [startedAt, setStartedAt] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const cuedRef = useRef(false)
  const lastTickSecRef = useRef<number | null>(null)

  useEffect(() => {
    if (offerToken <= 0) return
    stopTimerAlarm()
    cuedRef.current = false
    lastTickSecRef.current = null
    setTargetSec(getRestSeconds())
    setElapsedMs(0)
    setStartedAt(0)
    setPhase('offer')
    setPresetsOpen(false)
  }, [offerToken])

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
        playTimerDoneAlarm(getTimerTone())
        setPhase('done')
      }
    }

    tick()
    const id = window.setInterval(tick, 150)
    return () => window.clearInterval(id)
  }, [phase, startedAt, targetSec])

  useEffect(() => () => stopTimerAlarm(), [])

  function dismiss() {
    stopTimerAlarm()
    cuedRef.current = true
    lastTickSecRef.current = null
    setPhase('idle')
    setPresetsOpen(false)
  }

  function startRest() {
    stopTimerAlarm()
    void unlockTimerAudio()
    cuedRef.current = false
    lastTickSecRef.current = null
    const sec = getRestSeconds()
    setTargetSec(sec)
    setStartedAt(Date.now())
    setElapsedMs(0)
    setPhase('running')
    setPresetsOpen(false)
  }

  function applyPreset(sec: number) {
    const saved = setRestSeconds(sec)
    setTargetSec(saved)
    setPresetsOpen(false)
  }

  if (phase === 'idle') return null

  const elapsedSec = elapsedMs / 1000
  const targetLabel = formatRestTargetLabel(targetSec)

  if (phase === 'running' || phase === 'done') {
    return (
      <TimerFullscreen
        phase={phase}
        elapsedSec={elapsedSec}
        targetSec={targetSec}
        title="Descanso"
        primaryLabel="Empezar serie"
        onPrimary={dismiss}
        footer={
          phase === 'done' ? (
            <p>Alarma on. Toca “Empezar serie” para callarla.</p>
          ) : (
            <p>
              Pantalla completa · tick en los últimos {FINAL_TICK_SECONDS}s.
              Puedes cortar antes con el botón.
            </p>
          )
        }
      />
    )
  }

  /* offer */
  return (
    <div className="workout-rest-timer workout-rest-timer--offer" role="status">
      <button
        type="button"
        className="workout-rest-timer__start"
        onClick={startRest}
      >
        Descanso {targetLabel}
      </button>
      <div className="workout-rest-timer__offer-side">
        <button
          type="button"
          className="workout-rest-timer__btn"
          onClick={() => setPresetsOpen((v) => !v)}
          aria-expanded={presetsOpen}
        >
          Meta
        </button>
        <button
          type="button"
          className="workout-rest-timer__btn workout-rest-timer__btn--skip"
          onClick={dismiss}
        >
          No
        </button>
      </div>
      {presetsOpen ? (
        <div className="workout-rest-timer__presets">
          {REST_PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={[
                'workout-rest-timer__preset',
                sec === targetSec ? 'workout-rest-timer__preset--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => applyPreset(sec)}
            >
              {formatRestTargetLabel(sec)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
