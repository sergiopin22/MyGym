import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ProgressBar } from '../../components/ProgressBar'
import {
  buildManualSessionDraft,
  getManualLogDayOptions,
  insertManualCompletedSession,
} from '../../db/repository'
import type { RoutineDay, WorkoutSession } from '../../types'
import { addDaysISO, todayISODate, weekdayFromISO, weekdayLabel } from '../../utils/id'
import { getUnstartedWorkoutParts } from '../../utils/workout'
import { supportsStrapsTracking } from '../../utils/straps'
import { WorkoutExerciseCard } from '../workout/WorkoutExerciseCard'
import { PageHeader } from '../../ui/PageHeader'

function lastDateForWeekday(weekday: number, today: string): string {
  for (let i = 0; i <= 21; i++) {
    const iso = addDaysISO(today, -i)
    if (weekdayFromISO(iso) === weekday) return iso
  }
  return today
}

function cloneSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    muscleGroups: [...session.muscleGroups],
    exercises: session.exercises.map((ex) => ({
      ...ex,
      targetReps: { ...ex.targetReps },
      sets: ex.sets.map((s) => ({ ...s })),
    })),
  }
}

export function ManualLogPage() {
  const navigate = useNavigate()
  const today = todayISODate()
  const [date, setDate] = useState(() => addDaysISO(today, -1))
  const [days, setDays] = useState<RoutineDay[]>([])
  const dateAlignedRef = useRef(false)
  const [dayId, setDayId] = useState<string>('')
  const [draft, setDraft] = useState<WorkoutSession | null>(null)
  const [loadingDays, setLoadingDays] = useState(true)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getManualLogDayOptions()
      .then((rows) => {
        if (!alive) return
        setDays(rows)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los días')
        }
      })
      .finally(() => {
        if (alive) setLoadingDays(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const dateWeekday = weekdayFromISO(date)
  const matchingDay = useMemo(
    () => days.find((d) => d.weekday === dateWeekday),
    [days, dateWeekday],
  )

  useEffect(() => {
    if (dateAlignedRef.current || days.length === 0) return
    dateAlignedRef.current = true
    const weekday = weekdayFromISO(date)
    if (days.some((d) => d.weekday === weekday)) return
    for (let i = 1; i <= 21; i++) {
      const iso = addDaysISO(today, -i)
      if (days.some((d) => d.weekday === weekdayFromISO(iso))) {
        setDate(iso)
        return
      }
    }
  }, [days, date, today])

  useEffect(() => {
    if (draft || days.length === 0) return
    setDayId(matchingDay?.id ?? '')
  }, [days, matchingDay, draft])

  const selectedDay = matchingDay
  const isRestDate = !matchingDay && days.length > 0

  const exercises = useMemo(
    () =>
      draft ? [...draft.exercises].sort((a, b) => a.order - b.order) : [],
    [draft],
  )

  const completedCount = exercises.filter(
    (e) => e.status === 'completed' || e.status === 'skipped',
  ).length

  const hasBackStrapsExercises = draft
    ? exercises.some((ex) =>
        supportsStrapsTracking(ex.name, draft.muscleGroups),
      )
    : false

  function setStrapsForAllBack(withStraps: boolean) {
    if (!draft) return
    setError(null)
    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) => {
        if (!supportsStrapsTracking(ex.name, draft.muscleGroups)) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            withStraps: withStraps || undefined,
          })),
        }
      }),
    })
  }

  function confirmResetDraft(): boolean {
    if (!draft) return true
    return window.confirm(
      'Si cambias la fecha o el día, se borra lo que ya anotaste. ¿Seguir?',
    )
  }

  async function handleBuildDraft() {
    if (!matchingDay) return
    if (draft && !confirmResetDraft()) return
    setLoadingDraft(true)
    setError(null)
    try {
      const next = await buildManualSessionDraft(matchingDay.id, date)
      setDraft(cloneSession(next))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo armar la sesión')
      setDraft(null)
    } finally {
      setLoadingDraft(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    const leftover = getUnstartedWorkoutParts(draft)
    if (leftover.unstartedExercises > 0) {
      const preview = leftover.names.slice(0, 4).join('\n')
      setError(
        `Omite o completa al menos una serie en: ${leftover.names.join(', ')}.`,
      )
      window.alert(`Quedan ejercicios sin hacer ni omitir.\n\n${preview}`)
      return
    }

    const ok = window.confirm(
      `¿Guardar este entrenamiento en ${new Date(draft.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}?\n\nEntra al historial, a los PR y a la meta. No cuenta como recuperación.`,
    )
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      const { session, newPRs } = await insertManualCompletedSession(draft)
      if (newPRs.length > 0) {
        const names = newPRs.map((p) => p.exerciseName).join(', ')
        window.alert(`Guardado. PR nuevo: ${names}`)
      }
      navigate(`/historial/${session.id}`, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  function handleChangeDate() {
    if (!confirmResetDraft()) return
    setDraft(null)
  }

  return (
    <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg lg:max-w-4xl flex-col overflow-hidden px-4">
      {draft ? (
        <header className="focus-sticky-bar shrink-0 space-y-2 border-b border-line py-2">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/historial"
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              ← Historial
            </Link>
            <button
              type="button"
              className="text-xs font-semibold text-brand underline"
              disabled={saving}
              onClick={handleChangeDate}
            >
              Cambiar fecha
            </button>
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-fg">
              {selectedDay ? weekdayLabel(selectedDay.weekday) : draft.dayLabel}
            </h1>
            <p className="text-xs text-muted">
              {dateLabel} · {completedCount}/{exercises.length} ejercicios
            </p>
          </div>
          <ProgressBar
            value={completedCount}
            max={Math.max(exercises.length, 1)}
          />
        </header>
      ) : (
        <header className="focus-sticky-bar shrink-0 space-y-3 border-b border-line py-3">
          <PageHeader
            kicker="Focus · Cargar"
            title="Cargar entreno a mano"
            subtitle="Anota un día que sí entrenaste. No gasta la recuperación de la semana."
            back={
              <Link
                to="/historial"
                className="text-sm font-semibold text-muted hover:text-ink"
              >
                ← Historial
              </Link>
            }
          />
        </header>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3"
        style={{
          paddingBottom: draft
            ? '0.75rem'
            : 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {draft ? (
          <div className="space-y-4">
            {hasBackStrapsExercises ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-9 rounded-xl bg-chrome px-3 text-xs font-semibold text-chrome-fg"
                  disabled={saving}
                  onClick={() => setStrapsForAllBack(true)}
                >
                  Espalda con straps
                </button>
                <button
                  type="button"
                  className="min-h-9 rounded-xl bg-surface px-3 text-xs font-semibold text-fg ring-1 ring-line"
                  disabled={saving}
                  onClick={() => setStrapsForAllBack(false)}
                >
                  Sin straps
                </button>
              </div>
            ) : null}
            {exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={exercise.id}
                session={draft}
                exercise={exercise}
                editMode
                onSessionChange={setDraft}
              />
            ))}
            {error ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Fecha en que entrenaste
              </span>
              <input
                type="date"
                max={today}
                value={date}
                disabled={saving}
                onChange={(e) => {
                  const next = e.target.value
                  if (!next) return
                  setDate(next)
                  const weekday = weekdayFromISO(next)
                  const match = days.find((d) => d.weekday === weekday)
                  setDayId(match?.id ?? '')
                }}
                className="min-h-12 w-full rounded-2xl bg-surface px-3 text-base text-fg ring-1 ring-line"
              />
            </label>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Rutina que hiciste
              </p>
              {loadingDays ? (
                <p className="text-sm text-muted">Cargando días…</p>
              ) : days.length === 0 ? (
                <p className="text-sm text-muted">
                  No hay días con ejercicios. Agrégalos en Rutinas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const selected = day.id === dayId
                    return (
                      <button
                        key={day.id}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (day.id === dayId) return
                          setDate(lastDateForWeekday(day.weekday, today))
                          setDayId(day.id)
                        }}
                        className={[
                          'min-h-11 rounded-xl px-3 text-sm font-semibold ring-1 transition',
                          selected
                            ? 'bg-chrome text-chrome-fg ring-chrome'
                            : 'bg-surface text-fg ring-line',
                        ].join(' ')}
                      >
                        {weekdayLabel(day.weekday)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {isRestDate ? (
              <p className="text-xs text-muted">
                Esa fecha fue {weekdayLabel(dateWeekday)} y está de descanso.
                Elige un día en el que sí hayas entrenado.
              </p>
            ) : selectedDay ? (
              <p className="text-xs text-muted">
                Se guarda como el entrenamiento de{' '}
                {weekdayLabel(selectedDay.weekday)} en esa fecha. No cuenta como
                recuperación.
              </p>
            ) : null}

            {error ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : null}

            <Button
              fullWidth
              disabled={
                loadingDraft || saving || !matchingDay || days.length === 0
              }
              onClick={() => void handleBuildDraft()}
            >
              {loadingDraft ? 'Armando…' : 'Cargar ejercicios de ese día'}
            </Button>
          </div>
        )}
      </div>

      {draft ? (
        <div
          className="shrink-0 border-t border-line pt-3"
          style={{
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Guardando…' : 'Guardar entrenamiento'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
