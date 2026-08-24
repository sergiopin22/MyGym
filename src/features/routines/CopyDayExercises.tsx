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
  const [open, setOpen] = useState(false)

  const sortedDays = useMemo(
    () =>
      [...routine.days].sort(
        (a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday),
      ),
    [routine.days],
  )

  const daysWithExercises = sortedDays.filter((d) => d.exercises.length > 0)

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
  const [error, setError] = useState<string | null>(null)

  const fromDay = sortedDays.find((d) => d.id === fromDayId)
  const toDay = sortedDays.find((d) => d.id === toDayId)

  const canCopy =
    Boolean(fromDayId) &&
    Boolean(toDayId) &&
    fromDayId !== toDayId &&
    (fromDay?.exercises.length ?? 0) > 0

  function openPanel() {
    setFromDayId(defaultFrom)
    setToDayId(defaultTo)
    setError(null)
    setOpen(true)
  }

  function closePanel() {
    setOpen(false)
    setError(null)
  }

  async function finishOk() {
    closePanel()
    onDone()
  }

  async function handleCopy() {
    if (!fromDay || !toDay || !canCopy) return

    setBusy(true)
    setError(null)

    try {
      if (toDay.exercises.length > 0) {
        const ok = window.confirm(
          `El ${weekdayLabel(toDay.weekday)} ya tiene ejercicios.\n\n` +
            `¿Borrar esos y poner los del ${weekdayLabel(fromDay.weekday)}?`,
        )
        if (!ok) return
      }

      await copyExercisesFromDay(fromDay.id, toDay.id, {
        mode: 'replace',
        copyMuscleGroups: copyMuscles,
        routineId: routine.id,
      })
      await finishOk()
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

    try {
      await copyExercisesFromDay(fromDay.id, toDay.id, {
        mode: 'append',
        copyMuscleGroups: copyMuscles,
        routineId: routine.id,
      })
      await finishOk()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setBusy(false)
    }
  }

  if (daysWithExercises.length === 0) {
    return null
  }

  if (!open) {
    return (
      <Button variant="secondary" fullWidth onClick={openPanel}>
        Copiar ejercicios de otro día
      </Button>
    )
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Copiar ejercicios a otro día</h2>
          <p className="mt-1 text-sm text-muted">
            Ejemplo: pecho del <strong>lunes</strong> → mismo pecho el{' '}
            <strong>jueves</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={closePanel}
          className="min-h-11 min-w-11 rounded-full text-muted hover:bg-line/70 hover:text-ink"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">1. Día de origen</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={fromDayId}
          onChange={(e) => {
            setFromDayId(e.target.value)
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
        <span className="text-sm font-semibold text-ink">2. Día destino</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={toDayId}
          onChange={(e) => {
            setToDayId(e.target.value)
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

      <Button variant="ghost" fullWidth disabled={busy} onClick={closePanel}>
        Cancelar
      </Button>

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
