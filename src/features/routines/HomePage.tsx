import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import {
  ensureDefaultRoutine,
  getActiveSession,
  getCompletedSessionToday,
  startSession,
} from '../../db/repository'
import type { Routine, RoutineDay, Weekday, WorkoutSession } from '../../types'
import { isWeekend, weekdayLabel } from '../../utils/id'
import { ConstancyGoalCard } from './ConstancyGoalCard'
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
  const [completedToday, setCompletedToday] = useState<WorkoutSession | undefined>()
  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>(todayWeekday)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [recoveryDay, setRecoveryDay] = useState<RoutineDay | null>(null)
  const [goalRefresh, setGoalRefresh] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([
      ensureDefaultRoutine(),
      getActiveSession(),
      getCompletedSessionToday(),
    ])
      .then(([r, session, done]) => {
        if (!alive) return
        setRoutine(r)
        setActiveSession(session)
        setCompletedToday(done)
        if (session) {
          const sessionDay = r.days.find((d) => d.id === session.routineDayId)
          if (sessionDay) setSelectedWeekday(sessionDay.weekday)
        } else {
          setSelectedWeekday(todayWeekday)
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
  }, [todayWeekday])

  const days = useMemo(
    () => (routine ? sortDays(routine.days) : []),
    [routine],
  )

  const selectedDay = useMemo(() => {
    if (recoveryDay) return recoveryDay
    return days.find((d) => d.weekday === selectedWeekday) ?? days[0]
  }, [days, selectedWeekday, recoveryDay])

  const todayDay = useMemo(
    () => days.find((d) => d.weekday === todayWeekday),
    [days, todayWeekday],
  )

  const isRecoveryMode = Boolean(recoveryDay) && isWeekend(todayWeekday)
  const isTodaySelected = recoveryDay
    ? false
    : selectedWeekday === todayWeekday
  const isRestDay = Boolean(selectedDay?.isRestDay) && !isRecoveryMode

  const sessionForSelected =
    activeSession && selectedDay && activeSession.routineDayId === selectedDay.id
      ? activeSession
      : undefined

  const completedTodayForSelected =
    completedToday &&
    selectedDay &&
    completedToday.routineDayId === selectedDay.id &&
    isTodaySelected &&
    !completedToday.isRecovery
      ? completedToday
      : undefined

  const displayExercises =
    sessionForSelected?.exercises ??
    completedTodayForSelected?.exercises ??
    selectedDay?.exercises ??
    []

  const completedCount = displayExercises.filter(
    (e) => 'status' in e && e.status === 'completed',
  ).length
  const totalCount = displayExercises.length

  const todayDone =
    Boolean(completedToday) &&
    !completedToday?.isRecovery &&
    (!todayDay || completedToday?.routineDayId === todayDay.id)

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

  function handleSelectRecoveryDay(day: RoutineDay) {
    setRecoveryDay(day)
    setSelectedWeekday(day.weekday)
    setError(null)
  }

  function handleClearRecovery() {
    setRecoveryDay(null)
    setSelectedWeekday(todayWeekday)
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
      if (isRecoveryMode) {
        if (selectedDay.isRestDay) {
          setError('Ese día está marcado como descanso.')
          return
        }
        if (selectedDay.exercises.length === 0) {
          setError('Este día no tiene ejercicios. Agrégalos en Rutinas.')
          return
        }
        const session = await startSession(selectedDay.id, routine?.id, {
          recovery: true,
        })
        setActiveSession(session)
        setGoalRefresh((n) => n + 1)
        navigate(`/entrenar/${session.id}`)
        return
      }
      if (!isTodaySelected) {
        setError(`Solo puedes entrenar el día de hoy (${weekdayLabel(todayWeekday)}).`)
        return
      }
      if (todayDone) {
        setError('Ya completaste el entrenamiento de hoy.')
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
      <header className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0 space-y-1">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Mi Gym
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg">
            {weekdayLabel(todayWeekday)}
          </h1>
          <p className="text-muted">
            {today.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <img
          src="/brand/ippo.gif"
          alt=""
          className="h-28 w-28 shrink-0 rounded-2xl bg-black object-contain ring-1 ring-line"
        />
      </header>

      <ConstancyGoalCard
        recoveryDayId={recoveryDay?.id ?? null}
        onSelectRecoveryDay={handleSelectRecoveryDay}
        onClearRecovery={handleClearRecovery}
        refreshKey={goalRefresh}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted">
          {isRecoveryMode
            ? `Recuperando ${weekdayLabel(recoveryDay!.weekday)} — verás su rutina abajo`
            : 'Ver rutina de la semana (solo puedes entrenar hoy)'}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day) => {
            const active = day.weekday === (recoveryDay?.weekday ?? selectedWeekday)
            const isToday = day.weekday === todayWeekday
            const rest = Boolean(day.isRestDay)
            const recovering = recoveryDay?.id === day.id
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  if (recoveryDay && day.id !== recoveryDay.id) {
                    handleClearRecovery()
                  }
                  setSelectedWeekday(day.weekday)
                }}
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
                {recovering ? ' · Recup.' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && routine && isTodaySelected ? (
        <RestDayToggle
          day={selectedDay}
          routineId={routine.id}
          compact
          onChange={handleDayUpdated}
        />
      ) : null}

      <Card className="space-y-4">
        {isRestDay && !sessionForSelected && !completedTodayForSelected ? (
          <div className="space-y-2 text-center py-2">
            <span className="text-4xl" aria-hidden>
              😴
            </span>
            <h2 className="font-display text-xl font-bold">Día de descanso</h2>
            <p className="text-sm text-muted">
              {isTodaySelected
                ? 'Hoy no toca gym. Descansa y vuelve fuerte el próximo entreno.'
                : `${weekdayLabel(selectedWeekday)} está marcado como descanso.`}
            </p>
          </div>
        ) : (
          <>
            <div>
              {isRecoveryMode ? (
                <p className="mb-2 inline-flex rounded-full bg-progress-soft px-3 py-1 text-xs font-bold text-progress">
                  Recuperado · {weekdayLabel(recoveryDay!.weekday)}
                </p>
              ) : null}
              <h2 className="font-display text-xl font-bold">
                {selectedDay?.label ?? 'Sin día'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedDay?.muscleGroups.length
                  ? selectedDay.muscleGroups.join(' · ')
                  : 'Sin grupos musculares — configúralos en Rutinas'}
              </p>
            </div>

            {completedTodayForSelected ? (
              <p className="rounded-2xl bg-success-soft px-3 py-3 text-sm font-semibold text-accent-strong">
                ✅ Entrenamiento de hoy completado
              </p>
            ) : null}

            {isRecoveryMode ? (
              <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm text-fg">
                Vas a recuperar el{' '}
                <strong>{weekdayLabel(recoveryDay!.weekday)}</strong>. Al
                comenzar verás todas las máquinas de ese día con peso, reps y RIR.
                En el historial quedará etiquetado como recuperado.
              </p>
            ) : !isTodaySelected ? (
              <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm text-fg">
                Estás viendo la rutina del {weekdayLabel(selectedWeekday)}. Solo puedes
                comenzar el entrenamiento del día de hoy (
                {weekdayLabel(todayWeekday)}).
              </p>
            ) : null}

            <ProgressBar
              value={
                completedTodayForSelected
                  ? totalCount
                  : completedCount
              }
              max={Math.max(totalCount, 1)}
              label={
                completedTodayForSelected
                  ? `${totalCount} de ${totalCount} ejercicios`
                  : `${completedCount} de ${totalCount} ejercicios`
              }
            />

            {selectedDay && displayExercises.length > 0 ? (
              <ul className="space-y-2">
                {[...displayExercises]
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
            Tienes un entrenamiento en curso ({activeSession.dayLabel}). Continúalo o
            cancélalo desde ahí.
          </p>
        ) : null}

        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

        {activeSession ? (
          <Button fullWidth onClick={() => void handleStartOrContinue()} disabled={starting}>
            {starting ? 'Abriendo…' : 'Continuar entrenamiento'}
          </Button>
        ) : completedTodayForSelected || (todayDone && isTodaySelected) ? (
          <div className="space-y-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() =>
                navigate(
                  `/historial/${(completedTodayForSelected ?? completedToday)?.id}`,
                )
              }
            >
              Ver entrenamiento de hoy
            </Button>
          </div>
        ) : isRecoveryMode && !isRestDay ? (
          <Button
            fullWidth
            onClick={() => void handleStartOrContinue()}
            disabled={starting || (selectedDay?.exercises.length ?? 0) === 0}
          >
            {starting
              ? 'Abriendo…'
              : `Empezar entrenamiento · ${weekdayLabel(recoveryDay!.weekday)}`}
          </Button>
        ) : isTodaySelected && !isRestDay ? (
          <Button
            fullWidth
            onClick={() => void handleStartOrContinue()}
            disabled={starting || (selectedDay?.exercises.length ?? 0) === 0}
          >
            {starting ? 'Abriendo…' : 'Comenzar entrenamiento'}
          </Button>
        ) : null}
      </Card>
    </div>
  )
}
