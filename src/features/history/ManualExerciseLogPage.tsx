import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import {
  buildManualExerciseDraft,
  insertManualExerciseLog,
  listManualExerciseOptions,
  type ManualExerciseOption,
} from '../../db/repository'
import type { WorkoutSession } from '../../types'
import {
  addDaysISO,
  formatLongDateEs,
  todayISODate,
  weekdayFromISO,
  weekdayLabel,
} from '../../utils/id'
import { WorkoutExerciseCard } from '../workout/WorkoutExerciseCard'
import { PageHeader } from '../../ui/PageHeader'

function lastDateForWeekday(weekday: number, today: string): string {
  for (let i = 0; i <= 28; i++) {
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

export function ManualExerciseLogPage() {
  const navigate = useNavigate()
  const today = todayISODate()
  const [options, setOptions] = useState<ManualExerciseOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [selectedKey, setSelectedKey] = useState('')
  const [date, setDate] = useState(() => addDaysISO(today, -1))
  const [draft, setDraft] = useState<WorkoutSession | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listManualExerciseOptions()
      .then((rows) => {
        if (!alive) return
        setOptions(rows)
        if (rows[0]) {
          setSelectedKey(`${rows[0].dayId}::${rows[0].exercise.id}`)
          setDate(lastDateForWeekday(rows[0].weekday, today))
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(
            err instanceof Error ? err.message : 'No se pudieron cargar ejercicios',
          )
        }
      })
      .finally(() => {
        if (alive) setLoadingOptions(false)
      })
    return () => {
      alive = false
    }
  }, [today])

  const selected = useMemo(
    () =>
      options.find((row) => `${row.dayId}::${row.exercise.id}` === selectedKey) ??
      null,
    [options, selectedKey],
  )

  const dateMatches =
    selected != null && weekdayFromISO(date) === selected.weekday

  function confirmResetDraft(): boolean {
    if (!draft) return true
    return window.confirm(
      'Si cambias el ejercicio o la fecha, se borra lo que ya anotaste. ¿Seguir?',
    )
  }

  function pickOption(row: ManualExerciseOption) {
    const key = `${row.dayId}::${row.exercise.id}`
    if (key === selectedKey && !draft) return
    if (!confirmResetDraft()) return
    setSelectedKey(key)
    setDate(lastDateForWeekday(row.weekday, today))
    setDraft(null)
    setError(null)
  }

  async function handleBuildDraft() {
    if (!selected) return
    if (draft && !confirmResetDraft()) return
    setLoadingDraft(true)
    setError(null)
    try {
      const next = await buildManualExerciseDraft(
        selected.dayId,
        selected.exercise.id,
        date,
      )
      setDraft(cloneSession(next))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo armar')
      setDraft(null)
    } finally {
      setLoadingDraft(false)
    }
  }

  async function handleSave() {
    if (!draft) return
    const ok = window.confirm(
      `¿Guardar ${draft.exercises[0]?.name ?? 'este ejercicio'} del ${formatLongDateEs(draft.date)}?\n\nEntra al historial, a los PR y a la vista coach. No suma a la meta de constancia.`,
    )
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      const { session, newPRs, merged } = await insertManualExerciseLog(draft)
      if (newPRs.length > 0) {
        window.alert(`Guardado. PR nuevo: ${newPRs.map((p) => p.exerciseName).join(', ')}`)
      } else if (merged) {
        window.alert('Listo: se agregó al entrenamiento que ya tenías ese día.')
      }
      navigate(`/historial/${session.id}`, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const exercise = draft?.exercises[0] ?? null

  return (
    <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg lg:max-w-4xl flex-col overflow-hidden px-4">
      <header className="focus-sticky-bar shrink-0 space-y-3 border-b border-line py-3">
        <PageHeader
          kicker="Focus · Cargar"
          title={draft ? draft.exercises[0]?.name ?? 'Un ejercicio' : 'Cargar un ejercicio'}
          subtitle={
            draft
              ? `${formatLongDateEs(draft.date)} · solo esta máquina`
              : 'Anota series de una máquina en una fecha. Ideal si no registraste ese movimiento.'
          }
          back={
            <Link
              to="/historial"
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              ← Historial
            </Link>
          }
        />
        {draft ? (
          <button
            type="button"
            className="text-xs font-semibold text-brand underline"
            disabled={saving}
            onClick={() => {
              if (!confirmResetDraft()) return
              setDraft(null)
            }}
          >
            Cambiar ejercicio o fecha
          </button>
        ) : null}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3"
        style={{
          paddingBottom: draft
            ? '0.75rem'
            : 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {draft && exercise ? (
          <div className="space-y-4">
            <WorkoutExerciseCard
              session={draft}
              exercise={exercise}
              editMode
              onSessionChange={setDraft}
            />
            {error ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Ejercicio
              </p>
              {loadingOptions ? (
                <p className="text-sm text-muted">Cargando…</p>
              ) : options.length === 0 ? (
                <p className="text-sm text-muted">
                  No hay ejercicios en la rutina. Agrégalos en Rutinas (lunes y
                  jueves, por ejemplo).
                </p>
              ) : (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {options.map((row) => {
                    const key = `${row.dayId}::${row.exercise.id}`
                    const active = key === selectedKey
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => pickOption(row)}
                        className={[
                          'min-h-12 rounded-2xl px-3 py-2 text-left text-sm font-semibold ring-1 transition',
                          active
                            ? 'bg-chrome text-chrome-fg ring-chrome'
                            : 'bg-surface text-fg ring-line',
                        ].join(' ')}
                      >
                        <span className="block">{row.exercise.name}</span>
                        <span
                          className={[
                            'block text-xs font-medium',
                            active ? 'opacity-80' : 'text-muted',
                          ].join(' ')}
                        >
                          {weekdayLabel(row.weekday)} · {row.dayLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Fecha en que lo hiciste
              </span>
              <input
                type="date"
                max={today}
                value={date}
                disabled={saving || !selected}
                onChange={(e) => {
                  const next = e.target.value
                  if (!next) return
                  setDate(next)
                  setDraft(null)
                  setError(null)
                }}
                className="min-h-12 w-full rounded-2xl bg-surface px-3 text-base text-fg ring-1 ring-line"
              />
            </label>

            {selected && !dateMatches ? (
              <p className="text-sm font-medium text-danger">
                Ese ejercicio es de {weekdayLabel(selected.weekday)}. Elige una
                fecha que caiga en {weekdayLabel(selected.weekday)}.
              </p>
            ) : selected ? (
              <p className="text-xs text-muted">
                Si ese día ya tiene un entreno guardado, este ejercicio se agrega
                ahí. Si no, se crea solo con esta máquina. No suma a la meta.
              </p>
            ) : null}

            {error ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : null}

            <Button
              fullWidth
              disabled={
                loadingDraft ||
                saving ||
                !selected ||
                !dateMatches ||
                options.length === 0
              }
              onClick={() => void handleBuildDraft()}
            >
              {loadingDraft ? 'Armando…' : 'Anotar series'}
            </Button>

            <Link
              to="/historial/cargar"
              className="block text-center text-sm font-semibold text-brand underline"
            >
              ¿Prefieres cargar el día completo?
            </Link>
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
            {saving ? 'Guardando…' : 'Guardar ejercicio'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
