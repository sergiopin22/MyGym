import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import {
  ensureDefaultRoutine,
  getActiveSession,
  startSession,
} from '../../db/repository'
import type { Routine, RoutineDay, Weekday, WorkoutSession } from '../../types'
import { weekdayLabel } from '../../utils/id'
import { RestDayToggle } from './RestDayToggle'

function sortDays(days: RoutineDay[]): RoutineDay[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return [...days].sort(
    (a, b) => order.indexOf(a.weekday) - order.indexOf(b.weekday),
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const todayWeekday = new Date().getDay() as Weekday
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [activeSession, setActiveSession] = useState<WorkoutSession | undefined>()
  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>(todayWeekday)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([ensureDefaultRoutine(), getActiveSession()])
      .then(([r, session]) => {
        if (!alive) return
        setRoutine(r)
        setActiveSession(session)
        if (session) {
          const sessionDay = r.days.find((d) => d.id === session.routineDayId)
          if (sessionDay) setSelectedWeekday(sessionDay.weekday)
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Error al cargar')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const days = useMemo(
    () => (routine ? sortDays(routine.days) : []),
    [routine],
  )

  const selectedDay = useMemo(
    () => days.find((d) => d.weekday === selectedWeekday) ?? days[0],
    [days, selectedWeekday],
  )

  const isRestDay = Boolean(selectedDay?.isRestDay)

  const sessionForSelected =
    activeSession && selectedDay && activeSession.routineDayId === selectedDay.id
      ? activeSession
      : undefined

  const completedCount = sessionForSelected
    ? sessionForSelected.exercises.filter((e) => e.status === 'completed').length
    : 0
  const totalCount = sessionForSelected
    ? sessionForSelected.exercises.length
    : (selectedDay?.exercises.length ?? 0)

  const today = new Date()

  function handleDayUpdated(updated: RoutineDay) {
    setRoutine((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) => (d.id === updated.id ? updated : d)),
          }
        : prev,
    )
  }

  async function handleStartOrContinue() {
    if (!selectedDay) return
    setStarting(true)
    setError(null)
    try {
      if (activeSession) {
        navigate(`/entrenar/${activeSession.id}`)
        return
      }
      if (selectedDay.isRestDay) {
        setError('Este día está marcado como descanso.')
        return
      }
      if (selectedDay.exercises.length === 0) {
        setError('Este día no tiene ejercicios. Agrégalos en Rutinas.')
        return
      }
      const session = await startSession(selectedDay.id, routine?.id)
      setActiveSession(session)
      navigate(`/entrenar/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar')
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <p className="pt-8 text-muted">Cargando tu gimnasio…</p>

  return (
    <div className="space-y-6">
      <header className="space-y-1 pt-2">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Mi Gym
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {weekdayLabel(todayWeekday)}
        </h1>
        <p className="text-muted">
          {today.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      <Link
        to="/progreso#temas"
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface-elevated px-4 text-sm font-semibold text-fg transition active:scale-[0.99] hover:border-brand/50"
      >
        <span aria-hidden>🎨</span>
        Temas visuales (underground, rojo, azul…)
      </Link>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted">Elegir día de la rutina</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day) => {
            const active = day.weekday === selectedWeekday
            const isToday = day.weekday === todayWeekday
            const rest = Boolean(day.isRestDay)
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedWeekday(day.weekday)}
                className={[
                  'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-semibold transition active:scale-[0.98]',
                  active
                    ? 'bg-chrome text-chrome-fg'
                    : rest
                      ? 'bg-brand-soft/80 text-muted ring-1 ring-line'
                      : 'bg-surface-elevated text-muted ring-1 ring-line',
                ].join(' ')}
              >
                {weekdayLabel(day.weekday).slice(0, 3)}
                {rest ? ' · 😴' : ''}
                {isToday ? ' · Hoy' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && routine ? (
        <RestDayToggle
          day={selectedDay}
          routineId={routine.id}
          compact
          onChange={handleDayUpdated}
        />
      ) : null}

      <Card className="space-y-4">
        {isRestDay && !sessionForSelected ? (
          <div className="space-y-2 text-center py-2">
            <span className="text-4xl" aria-hidden>
              😴
            </span>
            <h2 className="font-display text-xl font-bold">Día de descanso</h2>
            <p className="text-sm text-muted">
              Hoy no toca gym. Descansa y vuelve fuerte el próximo entreno.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-display text-xl font-bold">
                {selectedDay?.label ?? 'Sin día'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedDay?.muscleGroups.length
                  ? selectedDay.muscleGroups.join(' · ')
                  : 'Sin grupos musculares — configúralos en Rutinas'}
              </p>
            </div>

            <ProgressBar
              value={completedCount}
              max={Math.max(totalCount, 1)}
              label={`${completedCount} de ${totalCount} ejercicios`}
            />

            {selectedDay && selectedDay.exercises.length > 0 ? (
              <ul className="space-y-2">
                {(sessionForSelected?.exercises ?? selectedDay.exercises)
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((ex) => {
                    const status =
                      'status' in ex ? ex.status : ('pending' as const)
                    const mark =
                      status === 'completed'
                        ? '✅'
                        : status === 'in_progress'
                          ? '🟡'
                          : '⏳'
                    return (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2.5 text-sm"
                      >
                        <span className="truncate font-medium">{ex.name}</span>
                        <span aria-hidden>{mark}</span>
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-surface px-3 py-3 text-sm text-muted">
                Este día está vacío.{' '}
                {selectedDay ? (
                  <Link
                    to={`/rutinas/${selectedDay.id}`}
                    className="font-semibold text-brand underline"
                  >
                    Agregar ejercicios
                  </Link>
                ) : null}
              </p>
            )}
          </>
        )}

        {activeSession && !sessionForSelected ? (
          <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm text-ink">
            Tienes un entrenamiento en curso ({activeSession.dayLabel}). Continúalo
            antes de empezar otro día.
          </p>
        ) : null}

        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

        {!isRestDay || activeSession ? (
          <Button
            fullWidth
            onClick={() => void handleStartOrContinue()}
            disabled={
              starting ||
              (!activeSession &&
                !isRestDay &&
                (selectedDay?.exercises.length ?? 0) === 0)
            }
          >
            {starting
              ? 'Abriendo…'
              : activeSession
                ? 'Continuar entrenamiento'
                : 'Comenzar entrenamiento'}
          </Button>
        ) : null}
      </Card>
    </div>
  )
}
