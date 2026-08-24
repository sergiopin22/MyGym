import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { copyExercisesFromDay } from '../../db/repository'
import type { Routine, RoutineDay } from '../../types'
import { weekdayLabel } from '../../utils/id'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function dayOptionLabel(d: RoutineDay) {
  const count = d.exercises.length
  const machines =
    count === 0
      ? 'sin ejercicios'
      : `${count} ejercicio${count === 1 ? '' : 's'}`
  return `${weekdayLabel(d.weekday)} (${machines})`
}

interface CopyDayExercisesProps {
  routine: Routine
  day: RoutineDay
  onDone: () => void
}

export function CopyDayExercises({ routine, day, onDone }: CopyDayExercisesProps) {
  const sortedDays = useMemo(
    () =>
      [...routine.days].sort(
        (a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday),
      ),
    [routine.days],
  )

  const daysWithExercises = sortedDays.filter((d) => d.exercises.length > 0)

  /** Por defecto: si este día está vacío, copiar HACIA aquí desde el primer día con ejercicios */
  const defaultFrom =
    day.exercises.length === 0
      ? (daysWithExercises.find((d) => d.id !== day.id)?.id ?? '')
      : day.id

  const defaultTo =
    day.exercises.length === 0
      ? day.id
      : (sortedDays.find((d) => d.id !== day.id)?.id ?? '')

  const [fromDayId, setFromDayId] = useState(defaultFrom)
  const [toDayId, setToDayId] = useState(defaultTo)
  const [copyMuscles, setCopyMuscles] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fromDay = sortedDays.find((d) => d.id === fromDayId)
  const toDay = sortedDays.find((d) => d.id === toDayId)

  const canCopy =
    Boolean(fromDayId) &&
    Boolean(toDayId) &&
    fromDayId !== toDayId &&
    (fromDay?.exercises.length ?? 0) > 0

  async function handleCopy() {
    if (!fromDay || !toDay || !canCopy) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      let mode: 'replace' | 'append' = 'replace'

      if (toDay.exercises.length > 0) {
        const ok = window.confirm(
          `El ${weekdayLabel(toDay.weekday)} ya tiene ejercicios.\n\n` +
            `¿Borrar esos y poner los del ${weekdayLabel(fromDay.weekday)}?`,
        )
        if (!ok) return
        mode = 'replace'
      }

      const updated = await copyExercisesFromDay(fromDay.id, toDay.id, {
        mode,
        copyMuscleGroups: copyMuscles,
        routineId: routine.id,
      })

      setMessage(
        `Listo: los ejercicios del ${weekdayLabel(fromDay.weekday)} quedaron en el ${weekdayLabel(toDay.weekday)} (${updated.exercises.length}).`,
      )
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setBusy(false)
    }
  }

  async function handleAppend() {
    if (!fromDay || !toDay || !canCopy) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await copyExercisesFromDay(fromDay.id, toDay.id, {
        mode: 'append',
        copyMuscleGroups: copyMuscles,
        routineId: routine.id,
      })

      setMessage(
        `Listo: se sumaron los del ${weekdayLabel(fromDay.weekday)} al ${weekdayLabel(toDay.weekday)} (${updated.exercises.length} en total).`,
      )
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setBusy(false)
    }
  }

  if (daysWithExercises.length === 0) {
    return (
      <Card>
        <h2 className="font-display text-lg font-bold">Copiar ejercicios a otro día</h2>
        <p className="mt-2 text-sm text-muted">
          Primero agrega ejercicios en un día (ej. lunes). Después podrás
          copiarlos al jueves u otro día.
        </p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Copiar ejercicios a otro día</h2>
        <p className="mt-1 text-sm text-muted">
          Ejemplo: pecho del <strong>lunes</strong> → mismo pecho el{' '}
          <strong>jueves</strong>, sin cargarlos otra vez.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">1. Día de origen (de dónde salen)</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={fromDayId}
          onChange={(e) => {
            setFromDayId(e.target.value)
            setMessage(null)
            setError(null)
          }}
        >
          {sortedDays.map((d) => (
            <option key={d.id} value={d.id} disabled={d.exercises.length === 0}>
              {dayOptionLabel(d)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">2. Día destino (dónde los quieres)</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={toDayId}
          onChange={(e) => {
            setToDayId(e.target.value)
            setMessage(null)
            setError(null)
          }}
        >
          {sortedDays.map((d) => (
            <option key={d.id} value={d.id} disabled={d.id === fromDayId}>
              {dayOptionLabel(d)}
            </option>
          ))}
        </select>
      </label>

      {fromDay && toDay && fromDayId !== toDayId ? (
        <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm font-medium text-ink">
          Vas a copiar:{' '}
          <strong>
            {weekdayLabel(fromDay.weekday)} → {weekdayLabel(toDay.weekday)}
          </strong>
          {fromDay.exercises.length > 0
            ? ` (${fromDay.exercises.length} ejercicio${fromDay.exercises.length === 1 ? '' : 's'})`
            : ''}
        </p>
      ) : null}

      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 accent-brand"
          checked={copyMuscles}
          onChange={(e) => setCopyMuscles(e.target.checked)}
        />
        Copiar también pecho / hombro / tríceps, etc.
      </label>

      <Button fullWidth disabled={busy || !canCopy} onClick={() => void handleCopy()}>
        {busy
          ? 'Copiando…'
          : fromDay && toDay
            ? `Copiar del ${weekdayLabel(fromDay.weekday)} al ${weekdayLabel(toDay.weekday)}`
            : 'Copiar ejercicios'}
      </Button>

      {(toDay?.exercises.length ?? 0) > 0 && canCopy ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => void handleAppend()}
        >
          Sumar sin borrar los que ya tiene el {toDay ? weekdayLabel(toDay.weekday) : 'destino'}
        </Button>
      ) : null}

      {message ? (
        <p className="rounded-2xl bg-[#dcfce7] px-3 py-2 text-sm font-medium text-accent-strong">
          {message}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
