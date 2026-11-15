import { useEffect, useRef, useState } from 'react'
import {
  formatRestClock,
  formatRestTargetLabel,
  getRestSeconds,
  playRestDoneCue,
  REST_PRESETS,
  setRestSeconds,
} from '../../utils/restTimer'

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
  const doneHideRef = useRef<number | null>(null)

  useEffect(() => {
    if (offerToken <= 0) return
    if (doneHideRef.current != null) {
      window.clearTimeout(doneHideRef.current)
      doneHideRef.current = null
    }
    cuedRef.current = false
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
      if (elapsed >= targetSec * 1000 && !cuedRef.current) {
        cuedRef.current = true
        playRestDoneCue()
        setPhase('done')
        doneHideRef.current = window.setTimeout(() => {
          setPhase('idle')
          doneHideRef.current = null
        }, 2500)
      }
    }

    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [phase, startedAt, targetSec])

  useEffect(() => {
    return () => {
      if (doneHideRef.current != null) {
        window.clearTimeout(doneHideRef.current)
      }
    }
  }, [])

  function dismiss() {
    if (doneHideRef.current != null) {
      window.clearTimeout(doneHideRef.current)
      doneHideRef.current = null
    }
    cuedRef.current = true
    setPhase('idle')
    setPresetsOpen(false)
  }

  function startRest() {
    if (doneHideRef.current != null) {
      window.clearTimeout(doneHideRef.current)
      doneHideRef.current = null
    }
    cuedRef.current = false
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
    if (phase === 'running') {
      /* reinicia conteo desde cero con la nueva meta */
      cuedRef.current = false
      setStartedAt(Date.now())
      setElapsedMs(0)
    }
  }

  if (phase === 'idle') return null

  const elapsedSec = elapsedMs / 1000
  const progress =
    targetSec > 0
      ? Math.min(1, Math.max(0, elapsedSec / targetSec))
      : 1
  const targetLabel = formatRestTargetLabel(targetSec)

  if (phase === 'offer') {
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
                  sec === targetSec
                    ? 'workout-rest-timer__preset--active'
                    : '',
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

  return (
    <div
      className={[
        'workout-rest-timer',
        phase === 'done' ? 'workout-rest-timer--done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-label={
        phase === 'done'
          ? 'Descanso terminado'
          : `Descanso ${formatRestClock(elapsedSec)} de ${targetLabel}`
      }
    >
      <div
        className="workout-rest-timer__bar"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <div className="workout-rest-timer__row">
        <div className="workout-rest-timer__copy">
          <p className="workout-rest-timer__kicker">
            {phase === 'done' ? 'Listo' : `Meta ${targetLabel}`}
          </p>
          <button
            type="button"
            className="workout-rest-timer__clock"
            disabled={phase === 'done'}
            onClick={() => setPresetsOpen((v) => !v)}
            aria-expanded={presetsOpen}
            title="Cambiar meta"
          >
            {phase === 'done' ? '¡Ya!' : formatRestClock(elapsedSec)}
          </button>
        </div>

        {phase === 'running' ? (
          <button
            type="button"
            className="workout-rest-timer__btn workout-rest-timer__btn--skip"
            onClick={dismiss}
          >
            Listo
          </button>
        ) : (
          <button
            type="button"
            className="workout-rest-timer__btn workout-rest-timer__btn--skip"
            onClick={dismiss}
          >
            Cerrar
          </button>
        )}
      </div>

      {presetsOpen && phase === 'running' ? (
        <div className="workout-rest-timer__presets">
          {REST_PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={[
                'workout-rest-timer__preset',
                sec === targetSec
                  ? 'workout-rest-timer__preset--active'
                  : '',
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
