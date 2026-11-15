import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWeeklyTrainingProgress } from '../../db/repository'
import { WeeklySummaryIcon } from './WeeklySummaryIcon'

interface WeeklySummaryHomeCardProps {
  /** Se recalcula al terminar un entreno, etc. */
  refreshKey?: number
}

/** Acceso permanente al resumen + cuántos entrenos faltan esta semana. */
export function WeeklySummaryHomeCard({
  refreshKey = 0,
}: WeeklySummaryHomeCardProps) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [planned, setPlanned] = useState(0)
  const [done, setDone] = useState(0)

  useEffect(() => {
    let alive = true
    getWeeklyTrainingProgress()
      .then((p) => {
        if (!alive) return
        setRemaining(p.remaining)
        setPlanned(p.planned)
        setDone(p.done)
      })
      .catch(() => {
        if (!alive) return
        setRemaining(null)
      })
    return () => {
      alive = false
    }
  }, [refreshKey])

  const subtitle =
    remaining == null
      ? 'Subidas y bajadas vs la semana pasada'
      : remaining === 0
        ? planned > 0
          ? `Semana completa (${done}/${planned}) · míralo cuando quieras`
          : 'Míralo cuando quieras'
        : remaining === 1
          ? `Aún falta 1 entreno (${done}/${planned})`
          : `Aún faltan ${remaining} entrenos (${done}/${planned})`

  return (
    <Link to="/historial/resumen-semanal" className="weekly-home-card">
      <span className="weekly-home-card__icon" aria-hidden>
        <WeeklySummaryIcon />
      </span>
      <span className="weekly-home-card__copy">
        <span className="weekly-home-card__title">Resumen semanal</span>
        <span className="weekly-home-card__sub">{subtitle}</span>
      </span>
      <span className="weekly-home-card__chev" aria-hidden>
        →
      </span>
    </Link>
  )
}
