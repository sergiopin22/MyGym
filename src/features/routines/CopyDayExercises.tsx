import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { copyExercisesFromDay } from '../../db/repository'
import type { Routine, RoutineDay } from '../../types'
import { weekdayLabel } from '../../utils/id'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface CopyDayExercisesProps {
  routine: Routine
  day: RoutineDay
  onDone: () => void
}

export function CopyDayExercises({ routine, day, onDone }: CopyDayExercisesProps) {
  const otherDays = useMemo(
    () =>
      [...routine.days]
        .filter((d) => d.id !== day.id)
        .sort(
          (a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday),
        ),
    [routine.days, day.id],
  )

  const daysWithExercises = otherDays.filter((d) => d.exercises.length > 0)

  const [fromDayId, setFromDayId] = useState(daysWithExercises[0]?.id ?? '')
  const [toDayId, setToDayId] = useState(otherDays[0]?.id ?? '')
  const [copyMuscles, setCopyMuscles] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runCopy(
    sourceId: string,
    targetId: string,
    mode: 'replace' | 'append',
  ) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const target = routine.days.find((d) => d.id === targetId)
      if (mode === 'replace' && (target?.exercises.length ?? 0) > 0) {
        const ok = window.confirm(
          'Esto reemplazará los ejercicios del día destino. ¿Continuar?',
        )
        if (!ok) return
      }

      const updated = await copyExercisesFromDay(sourceId, targetId, {
        mode,
        copyMuscleGroups: copyMuscles,
        routineId: routine.id,
      })
      setMessage(
        `Listo: ${updated.exercises.length} ejercicio${updated.exercises.length === 1 ? '' : 's'} en ${updated.label}.`,
      )
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Copiar máquinas / ejercicios</h2>
        <p className="mt-1 text-sm text-muted">
          Ideal si el jueves usas las mismas máquinas que el lunes.
        </p>
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 accent-brand"
          checked={copyMuscles}
          onChange={(e) => setCopyMuscles(e.target.checked)}
        />
        Copiar también grupos musculares
      </label>

      <div className="space-y-3 rounded-2xl bg-surface p-3">
        <p className="text-sm font-semibold text-ink">Traer a este día</p>
        {daysWithExercises.length === 0 ? (
          <p className="text-sm text-muted">
            Ningún otro día tiene ejercicios todavía.
          </p>
        ) : (
          <>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold">Copiar desde</span>
              <select
                className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                value={fromDayId}
                onChange={(e) => setFromDayId(e.target.value)}
              >
                {daysWithExercises.map((d) => (
                  <option key={d.id} value={d.id}>
                    {weekdayLabel(d.weekday)} — {d.label} ({d.exercises.length})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                fullWidth
                disabled={busy || !fromDayId}
                onClick={() => void runCopy(fromDayId, day.id, 'replace')}
              >
                Reemplazar aquí
              </Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={busy || !fromDayId}
                onClick={() => void runCopy(fromDayId, day.id, 'append')}
              >
                Agregar a los de aquí
              </Button>
            </div>
          </>
        )}
      </div>

      {day.exercises.length > 0 ? (
        <div className="space-y-3 rounded-2xl bg-surface p-3">
          <p className="text-sm font-semibold text-ink">Enviar este día a otro</p>
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Copiar hacia</span>
            <select
              className="min-h-12 w-full rounded-2xl border border-line bg-surface-elevated px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
              value={toDayId}
              onChange={(e) => setToDayId(e.target.value)}
            >
              {otherDays.map((d) => (
                <option key={d.id} value={d.id}>
                  {weekdayLabel(d.weekday)} — {d.label} ({d.exercises.length})
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              fullWidth
              disabled={busy || !toDayId}
              onClick={() => void runCopy(day.id, toDayId, 'replace')}
            >
              Reemplazar allá
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={busy || !toDayId}
              onClick={() => void runCopy(day.id, toDayId, 'append')}
            >
              Agregar allá
            </Button>
          </div>
        </div>
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
