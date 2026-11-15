import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  dismissWeeklyBanner,
  getWeeklyBannerWeekStart,
  isWeeklyBannerDismissed,
} from '../../utils/weeklyBanner'
import { addDaysISO, formatShortDateEs } from '../../utils/id'

/** Aviso lun/mar: la semana pasada ya se puede ver. */
export function WeeklySummaryBanner() {
  const weekStart = useMemo(() => getWeeklyBannerWeekStart(), [])
  const [hidden, setHidden] = useState(() =>
    weekStart ? isWeeklyBannerDismissed(weekStart) : true,
  )

  if (!weekStart || hidden) return null

  const weekEnd = addDaysISO(weekStart, 6)

  return (
    <div className="weekly-banner">
      <div className="weekly-banner__copy">
        <p className="weekly-banner__kicker">Resumen semanal</p>
        <p className="weekly-banner__title">Tu semana ya está lista</p>
        <p className="weekly-banner__sub">
          {formatShortDateEs(weekStart)} – {formatShortDateEs(weekEnd)} · subidas,
          iguales y bajadas con datos reales
        </p>
      </div>
      <div className="weekly-banner__actions">
        <Link
          to={`/historial/resumen-semanal?semana=${weekStart}`}
          className="weekly-banner__cta"
        >
          Ver resumen
        </Link>
        <button
          type="button"
          className="weekly-banner__dismiss"
          onClick={() => {
            dismissWeeklyBanner(weekStart)
            setHidden(true)
          }}
        >
          Luego
        </button>
      </div>
    </div>
  )
}
