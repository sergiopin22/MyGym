import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { PageHeader } from '../../ui/PageHeader'
import {
  formatRestClock,
  formatRestTargetLabel,
  getRestSeconds,
  playRestDoneCue,
  REST_PRESETS,
  setRestSeconds,
} from '../../utils/restTimer'

type Phase = 'idle' | 'running' | 'done'

/**
 * Temporizador suelto (menú). No depende de marcar series en el entreno.
 */
export function StandaloneTimerPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [targetSec, setTargetSec] = useState(() => getRestSeconds())
  const [startedAt, setStartedAt] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const cuedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'running') return

    function tick() {
      const elapsed = Math.max(0, Date.now() - startedAt)
      setElapsedMs(elapsed)
      if (elapsed >= targetSec * 1000 && !cuedRef.current) {
        cuedRef.current = true
        playRestDoneCue()
        setPhase('done')
      }
    }

    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [phase, startedAt, targetSec])

  function start() {
    cuedRef.current = false
    const saved = setRestSeconds(targetSec)
    setTargetSec(saved)
    setStartedAt(Date.now())
    setElapsedMs(0)
    setPhase('running')
  }

  function stop() {
    cuedRef.current = true
    setPhase('idle')
    setElapsedMs(0)
  }

  function pickPreset(sec: number) {
    const saved = setRestSeconds(sec)
    setTargetSec(saved)
    if (phase === 'running') {
      cuedRef.current = false
      setStartedAt(Date.now())
      setElapsedMs(0)
    }
  }

  const elapsedSec = elapsedMs / 1000
  const progress =
    targetSec > 0 ? Math.min(1, Math.max(0, elapsedSec / targetSec)) : 0

  return (
    <div className="standalone-timer space-y-5">
      <PageHeader
        kicker="Focus · Tools"
        title="Temporizador"
        subtitle="Independiente del entreno. Úsalo cuando quieras."
        back={
          <Link
            to="/"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Inicio
          </Link>
        }
      />

      <div
        className={[
          'standalone-timer__card',
          phase === 'done' ? 'standalone-timer__card--done' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className="standalone-timer__bar"
          style={{ transform: `scaleX(${phase === 'idle' ? 0 : progress})` }}
          aria-hidden
        />
        <p className="standalone-timer__kicker">
          {phase === 'done'
            ? 'Listo'
            : phase === 'running'
              ? `Meta ${formatRestTargetLabel(targetSec)}`
              : 'Elige meta y arranca'}
        </p>
        <p className="standalone-timer__clock" aria-live="polite">
          {phase === 'done'
            ? '¡Ya!'
            : phase === 'running'
              ? formatRestClock(elapsedSec)
              : formatRestClock(0)}
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

      {phase === 'idle' || phase === 'done' ? (
        <Button fullWidth onClick={start}>
          Empezar · {formatRestTargetLabel(targetSec)}
        </Button>
      ) : (
        <Button fullWidth variant="ghost" onClick={stop}>
          Detener
        </Button>
      )}

      <p className="text-center text-xs text-muted">
        En el entreno también puedes usar “Descanso 3 min” al marcar una serie.
        Este de acá es aparte.
      </p>
    </div>
  )
}
