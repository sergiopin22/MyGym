import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { setDayRestMode } from '../../db/repository'
import type { RoutineDay } from '../../types'
import { weekdayLabel } from '../../utils/id'

interface RestDayToggleProps {
  day: RoutineDay
  routineId: string
  onChange: (day: RoutineDay) => void
  compact?: boolean
  /** Si ya entrenaste hoy, no tiene sentido marcarlo como descanso */
  disabled?: boolean
  disabledReason?: string
}

export function RestDayToggle({
  day,
  routineId,
  onChange,
  compact = false,
  disabled = false,
  disabledReason,
}: RestDayToggleProps) {
  const isRest = Boolean(day.isRestDay)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (disabled) return
    setBusy(true)
    try {
      const updated = await setDayRestMode(day.id, !isRest, routineId)
      onChange(updated)
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <Button
          variant={isRest ? 'secondary' : 'ghost'}
          fullWidth
          disabled={busy || disabled}
          onClick={() => void toggle()}
        >
          {busy
            ? 'Guardando…'
            : isRest
              ? 'Este día sí entreno'
              : 'No iré al gym / descanso'}
        </Button>
        {disabled && disabledReason ? (
          <p className="text-center text-xs text-muted">{disabledReason}</p>
        ) : null}
      </div>
    )
  }

  return (
    <Card
      className={[
        'space-y-3',
        isRest ? 'border-brand/40 bg-brand-soft/40' : '',
      ].join(' ')}
    >
      {isRest ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              😴
            </span>
            <div>
              <p className="font-display text-lg font-bold">Día de descanso</p>
              <p className="text-sm text-muted">
                {weekdayLabel(day.weekday)} — no toca ir al gym.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy || disabled}
            onClick={() => void toggle()}
          >
            {busy ? 'Guardando…' : 'Este día sí entreno'}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            ¿Este día no vas al gym? Márcalo como descanso (ideal para sábado o
            domingo).
          </p>
          <Button
            variant="ghost"
            fullWidth
            disabled={busy || disabled}
            onClick={() => void toggle()}
          >
            {busy ? 'Guardando…' : 'No iré al gym / descanso'}
          </Button>
        </>
      )}
      {disabled && disabledReason ? (
        <p className="text-xs text-muted">{disabledReason}</p>
      ) : null}
    </Card>
  )
}
