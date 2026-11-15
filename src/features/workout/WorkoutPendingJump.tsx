import { useEffect, useState } from 'react'

interface WorkoutPendingJumpProps {
  pendingCount: number
  onJump: () => void
  direction: 'up' | 'down'
}

/** Flecha flotante: salta al siguiente ejercicio sin terminar. */
export function WorkoutPendingJump({
  pendingCount,
  onJump,
  direction,
}: WorkoutPendingJumpProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(pendingCount > 0)
  }, [pendingCount])

  if (!visible || pendingCount <= 0) return null

  const label =
    pendingCount === 1
      ? 'Ir al ejercicio que falta'
      : `Ir a un ejercicio pendiente (${pendingCount})`

  return (
    <button
      type="button"
      className="workout-pending-fab"
      aria-label={label}
      onClick={onJump}
    >
      <span className="workout-pending-fab__arrow" aria-hidden>
        {direction === 'up' ? '↑' : '↓'}
      </span>
      <span className="workout-pending-fab__count">{pendingCount}</span>
    </button>
  )
}
