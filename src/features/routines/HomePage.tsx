import { useEffect, useMemo, useRef, useState } from 'react'
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
import { BrandAvatarButton } from './BrandAvatarButton'
import { RestDayToggle } from './RestDayToggle'
import { BackupReminderCard } from '../backup/BackupReminderCard'
import { useTheme } from '../../context/ThemeProvider'

function sortDays(days: RoutineDay[]): RoutineDay[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return [...days].sort(
    (a, b) => order.indexOf(a.weekday) - order.indexOf(b.weekday),
  )
}

function FocusPosterHero({
  progressPct,
  weekday,
  dayLabel,
  muscles,
}: {
  progressPct: number
  weekday: Weekday
  dayLabel: string
  muscles: string[]
}) {
  const [ringPct, setRingPct] = useState(0)

  useEffect(() => {
    setRingPct(0)
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setRingPct(progressPct)
      return
    }
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setRingPct(progressPct)
      })
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [progressPct])

  const turn = Math.max(0, Math.min(1, ringPct / 100))

  return (
    <section className="focus-poster">
      <div className="focus-poster__orb">
        <div className="focus-poster__orb-motion">
          <BrandAvatarButton size="poster" />
          <div
            className="focus-poster__ring"
            style={{ ['--focus-pct' as string]: `${ringPct}%` }}
            aria-hidden
          />
          {ringPct > 0 ? (
            <div
              className="focus-poster__spark-track"
              style={{ ['--focus-turn' as string]: String(turn) }}
              aria-hidden
            >
              <span className="focus-poster__spark" />
            </div>
          ) : null}
        </div>
      </div>
      <p className="focus-home-kicker">Arena · Hoy</p>
      <h1 className="focus-home-title text-fg">{weekdayLabel(weekday)}</h1>
      <p className="focus-page-sub">
        {dayLabel}
        {muscles.length ? ` · ${muscles.join(' · ')}` : ''}
      </p>
      <p className="focus-poster__pct" aria-live="polite">
        {progressPct}% del día
      </p>
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { uiLayout } = useTheme()
  const isFocus = uiLayout === 'focus'
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
  const [locateToday, setLocateToday] = useState(false)
  const [focusDeck, setFocusDeck] = useState<'hoy' | 'semana' | 'meta'>('hoy')
  const [weekExpanded, setWeekExpanded] = useState<Weekday | null>(todayWeekday)
  const [posterEnterKey, setPosterEnterKey] = useState(0)
  const todayChipRef = useRef<HTMLButtonElement | null>(null)
  const todayLocatePlayedRef = useRef(false)

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

  useEffect(() => {
    if (loading || !routine || todayLocatePlayedRef.current) return
    todayLocatePlayedRef.current = true
    // Espera al paint del chip "Hoy" para scroll + animación
    const frame = window.requestAnimationFrame(() => {
      setLocateToday(true)
      todayChipRef.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    })
    const clearMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 2600
    const timer = window.setTimeout(() => setLocateToday(false), clearMs)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [loading, routine])

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
        if (
          selectedDay &&
          activeSession.routineDayId !== selectedDay.id
        ) {
          setError(
            `Ya tienes un entrenamiento en curso (${activeSession.dayLabel}). Continúalo o cancélalo antes de empezar otro.`,
          )
          return
        }
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

  if (loading) return <p className="pt-8 text-muted focus-section-pad">Cargando tu gimnasio…</p>

  const dayStrip = (
    <div
      className={[
        isFocus
          ? 'focus-day-strip'
          : '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1',
      ].join(' ')}
    >
      {days.map((day) => {
        const active = day.weekday === (recoveryDay?.weekday ?? selectedWeekday)
        const isToday = day.weekday === todayWeekday
        const rest = Boolean(day.isRestDay)
        const recovering = recoveryDay?.id === day.id
        const short = weekdayLabel(day.weekday).slice(0, 3)
        return (
          <button
            key={day.id}
            ref={isToday ? todayChipRef : undefined}
            type="button"
            onClick={() => {
              if (recoveryDay && day.id !== recoveryDay.id) {
                handleClearRecovery()
              }
              setSelectedWeekday(day.weekday)
            }}
            className={[
              isFocus
                ? 'transition active:scale-[0.97]'
                : 'min-h-12 shrink-0 rounded-2xl px-4 text-sm font-semibold transition active:scale-[0.98]',
              active
                ? 'bg-chrome text-chrome-fg'
                : rest
                  ? 'bg-brand-soft/80 text-muted ring-1 ring-line'
                  : 'bg-surface-elevated text-muted ring-1 ring-line',
              isToday && locateToday ? 'today-chip-locate' : '',
            ].join(' ')}
          >
            {isFocus ? (
              <>
                <span>{short}</span>
                {isToday ? <span className="text-[0.58rem] opacity-90">Hoy</span> : null}
                {rest ? <span className="text-[0.58rem] opacity-80">Desc</span> : null}
                {recovering ? <span className="text-[0.58rem] opacity-80">Rec</span> : null}
              </>
            ) : (
              <>
                {short}
                {rest ? ' · 😴' : ''}
                {isToday ? ' · Hoy' : ''}
                {recovering ? ' · Recup.' : ''}
              </>
            )}
          </button>
        )
      })}
    </div>
  )

  const sessionActions = (
    <>
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
    </>
  )

  const sessionBody = (
    <>
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
                      className={[
                        'flex items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2.5 text-sm',
                        isFocus ? 'focus-list-row' : '',
                      ].join(' ')}
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

      {sessionActions}
    </>
  )

  if (isFocus) {
    const progressPct =
      totalCount <= 0
        ? 0
        : Math.round(
            ((completedTodayForSelected ? totalCount : completedCount) /
              Math.max(totalCount, 1)) *
              100,
          )

    return (
      <div className="focus-home focus-arena">
        <nav className="focus-deck" aria-label="Secciones Focus">
          {(
            [
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Semana' },
              { id: 'meta', label: 'Meta' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={[
                'focus-deck__tab',
                focusDeck === tab.id ? 'focus-deck__tab--active' : '',
              ].join(' ')}
              aria-pressed={focusDeck === tab.id}
              onClick={() => {
                setFocusDeck(tab.id)
                if (tab.id === 'hoy') setPosterEnterKey((k) => k + 1)
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {focusDeck === 'hoy' ? (
          <>
            <FocusPosterHero
              key={posterEnterKey}
              progressPct={progressPct}
              weekday={todayWeekday}
              dayLabel={selectedDay?.label ?? 'Sin día'}
              muscles={selectedDay?.muscleGroups ?? []}
            />

            <div className="focus-section-pad">
              <BackupReminderCard />
            </div>

            {selectedDay && routine && isTodaySelected ? (
              <div className="focus-section-pad">
                <RestDayToggle
                  day={selectedDay}
                  routineId={routine.id}
                  compact
                  disabled={todayDone}
                  disabledReason={
                    todayDone
                      ? 'Ya entrenaste hoy: no puedes marcarlo como descanso.'
                      : undefined
                  }
                  onChange={handleDayUpdated}
                />
              </div>
            ) : null}

            <section className="focus-runway">
              <p className="focus-runway__label">Pista de ejercicios</p>
              {isRestDay && !sessionForSelected && !completedTodayForSelected ? (
                <div className="focus-runway__empty">
                  <span aria-hidden>😴</span>
                  <p>Día de descanso</p>
                </div>
              ) : displayExercises.length > 0 ? (
                <ol className="focus-runway__list">
                  {[...displayExercises]
                    .sort((a, b) => a.order - b.order)
                    .map((ex, index) => {
                      const status =
                        'status' in ex ? ex.status : ('pending' as const)
                      return (
                        <li key={ex.id} className="focus-runway__item">
                          <span className="focus-runway__num">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="focus-runway__name">{ex.name}</span>
                          <span className="focus-runway__mark" aria-hidden>
                            {status === 'completed'
                              ? '●'
                              : status === 'in_progress'
                                ? '◐'
                                : '○'}
                          </span>
                        </li>
                      )
                    })}
                </ol>
              ) : (
                <p className="focus-runway__empty">
                  Sin ejercicios.{' '}
                  {selectedDay ? (
                    <Link to={`/rutinas/${selectedDay.id}`}>Agregar</Link>
                  ) : null}
                </p>
              )}

              <div className="focus-runway__actions space-y-3">
                {activeSession && !sessionForSelected ? (
                  <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm text-ink">
                    Tienes un entrenamiento en curso ({activeSession.dayLabel}).
                  </p>
                ) : null}
                {sessionActions}
              </div>
            </section>
          </>
        ) : null}

        {focusDeck === 'semana' ? (
          <section className="focus-week-ladder">
            <header className="focus-week-ladder__head">
              <p className="focus-home-kicker">Mapa semanal</p>
              <h2 className="focus-week-ladder__title">
                {isRecoveryMode
                  ? `Recuperando ${weekdayLabel(recoveryDay!.weekday)}`
                  : 'Tu semana en escalera'}
              </h2>
              <p className="focus-page-sub">
                Toca un día para abrirlo. Hoy es el único que puedes entrenar.
              </p>
            </header>

            <ul className="focus-week-ladder__list">
              {days.map((day, index) => {
                const open = weekExpanded === day.weekday
                const isToday = day.weekday === todayWeekday
                const rest = Boolean(day.isRestDay)
                const recovering = recoveryDay?.id === day.id
                const short = weekdayLabel(day.weekday).slice(0, 3).toUpperCase()
                return (
                  <li
                    key={day.id}
                    className={[
                      'focus-week-ladder__row',
                      open ? 'focus-week-ladder__row--open' : '',
                      isToday ? 'focus-week-ladder__row--today' : '',
                      rest ? 'focus-week-ladder__row--rest' : '',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      className="focus-week-ladder__hit"
                      ref={isToday ? todayChipRef : undefined}
                      aria-expanded={open}
                      onClick={() => {
                        if (open) {
                          setWeekExpanded(null)
                          return
                        }
                        if (recoveryDay && day.id !== recoveryDay.id) {
                          handleClearRecovery()
                        }
                        setSelectedWeekday(day.weekday)
                        setWeekExpanded(day.weekday)
                      }}
                    >
                      <span className="focus-week-ladder__index" aria-hidden>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="focus-week-ladder__day">{short}</span>
                      <span className="focus-week-ladder__body">
                        <span className="focus-week-ladder__name">
                          {rest ? 'Descanso' : day.label}
                        </span>
                        <span className="focus-week-ladder__meta">
                          {rest
                            ? 'Sin gym'
                            : day.muscleGroups.length
                              ? day.muscleGroups.join(' · ')
                              : `${day.exercises.length} ejercicios`}
                        </span>
                      </span>
                      <span className="focus-week-ladder__flags">
                        {isToday ? <span className="focus-week-ladder__pill">Hoy</span> : null}
                        {recovering ? (
                          <span className="focus-week-ladder__pill focus-week-ladder__pill--alt">
                            Recup.
                          </span>
                        ) : null}
                        <span className="focus-week-ladder__chev" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </span>
                    </button>

                    {open ? (
                      <div className="focus-week-ladder__panel space-y-3">
                        {selectedDay && routine && isTodaySelected ? (
                          <RestDayToggle
                            day={selectedDay}
                            routineId={routine.id}
                            compact
                            disabled={todayDone}
                            disabledReason={
                              todayDone
                                ? 'Ya entrenaste hoy: no puedes marcarlo como descanso.'
                                : undefined
                            }
                            onChange={handleDayUpdated}
                          />
                        ) : null}
                        {sessionBody}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {focusDeck === 'meta' ? (
          <section className="focus-meta-deck">
            <header className="focus-meta-deck__hero">
              <p className="focus-home-kicker">Vault</p>
              <h2 className="focus-meta-deck__title">La racha</h2>
              <p className="focus-page-sub">
                Un solo número. Un premio. Sin ruido.
              </p>
            </header>
            <ConstancyGoalCard
              recoveryDayId={recoveryDay?.id ?? null}
              onSelectRecoveryDay={(day) => {
                handleSelectRecoveryDay(day)
                setWeekExpanded(day.weekday)
                setFocusDeck('semana')
              }}
              onClearRecovery={handleClearRecovery}
              refreshKey={goalRefresh}
            />
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
      <header className="mt-2 flex items-start justify-between gap-3">
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
        <BrandAvatarButton />
      </header>

      <BackupReminderCard />

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
        {dayStrip}
      </div>

      {selectedDay && routine && isTodaySelected ? (
        <RestDayToggle
          day={selectedDay}
          routineId={routine.id}
          compact
          disabled={todayDone}
          disabledReason={
            todayDone
              ? 'Ya entrenaste hoy: no puedes marcarlo como descanso.'
              : undefined
          }
          onChange={handleDayUpdated}
        />
      ) : null}

      <Card className="space-y-4">{sessionBody}</Card>
      </div>
    </>
  )
}
