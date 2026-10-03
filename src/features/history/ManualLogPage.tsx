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
    setDayId((current) => {
      if (current && days.some((d) => d.id === current)) return current
      return matchingDay?.id ?? days[0]?.id ?? ''
    })
  }, [days, matchingDay, draft])

  const selectedDay = days.find((d) => d.id === dayId)
  const isRecovery =
    Boolean(selectedDay) && selectedDay!.weekday !== dateWeekday

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
    if (!dayId) return
    if (draft && !confirmResetDraft()) return
    setLoadingDraft(true)
    setError(null)
    try {
      const next = await buildManualSessionDraft(dayId, date)
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
      `¿Guardar este entrenamiento en ${new Date(draft.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}?\n\nEntra al historial, a los PR y a la meta de constancia.`,
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

  return (
    <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg lg:max-w-4xl flex-col overflow-hidden px-4">
      <header className="focus-sticky-bar shrink-0 space-y-3 border-b border-line py-3">
        <PageHeader
          kicker="Focus · Cargar"
          title="Cargar entreno a mano"
          subtitle="Para un día que sí hiciste y no quedó en la app (notas, fallo, etc.)."
          back={
            <Link
              to="/historial"
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              ← Historial
            </Link>
          }
        />

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
                if (draft && !confirmResetDraft()) return
                setDate(next)
                setDraft(null)
                const weekday = weekdayFromISO(next)
                const match = days.find((d) => d.weekday === weekday)
                if (match) setDayId(match.id)
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
                        if (draft && !confirmResetDraft()) return
                        setDayId(day.id)
                        setDraft(null)
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

          {selectedDay ? (
            <p className="text-xs text-muted">
              {isRecovery
                ? `Esa fecha fue ${weekdayLabel(dateWeekday)}. Se guardará como recuperación de ${weekdayLabel(selectedDay.weekday)} (cuenta como la 1 de esa semana).`
                : `Se guarda como el entrenamiento de ${weekdayLabel(selectedDay.weekday)} en esa fecha.`}
            </p>
          ) : null}

          <Button
            fullWidth
            variant={draft ? 'secondary' : 'primary'}
            disabled={loadingDraft || saving || !dayId || days.length === 0}
            onClick={() => void handleBuildDraft()}
          >
            {loadingDraft
              ? 'Armando…'
              : draft
                ? 'Rehacer lista de ejercicios'
                : 'Cargar ejercicios de ese día'}
          </Button>
        </div>

        {draft ? (
          <>
            {draft.isRecovery ? (
              <span className="inline-flex rounded-full bg-progress-soft px-2.5 py-1 text-xs font-bold text-progress">
                Recuperado
                {draft.recoveredDayLabel ? ` · ${draft.recoveredDayLabel}` : ''}
              </span>
            ) : null}
            <ProgressBar
              value={completedCount}
              max={Math.max(exercises.length, 1)}
            />
            <p className="rounded-2xl bg-brand-soft px-3 py-2 text-xs text-fg">
              Anota peso, reps y RIR de cada serie (como en tus notas). Omite lo
              que no hayas hecho.
            </p>
            {hasBackStrapsExercises ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="min-h-10 px-3 text-sm"
                  disabled={saving}
                  onClick={() => setStrapsForAllBack(true)}
                >
                  Marcar espalda con straps
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-10 px-3 text-sm"
                  disabled={saving}
                  onClick={() => setStrapsForAllBack(false)}
                >
                  Quitar straps en espalda
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {draft ? (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={exercise.id}
                session={draft}
                exercise={exercise}
                editMode
                onSessionChange={setDraft}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Elige fecha y rutina, carga los ejercicios y pasa tus series desde
            las notas.
          </p>
        )}

        {error ? (
          <p className="mt-4 text-sm font-medium text-danger">{error}</p>
        ) : null}

        {draft ? (
          <div className="mt-6 space-y-2">
            <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Guardando…' : 'Guardar entrenamiento'}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              disabled={saving}
              onClick={() => navigate('/historial')}
            >
              Cancelar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
