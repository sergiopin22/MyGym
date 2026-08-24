import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { TextField } from '../../components/TextField'
import {
  getRoutineDay,
  removeExerciseFromDay,
  reorderExercises,
  updateRoutineDay,
} from '../../db/repository'
import type { Routine, RoutineDay, RoutineExercise } from '../../types'
import { weekdayLabel } from '../../utils/id'
import { ExerciseEditor } from './ExerciseEditor'
import { MuscleGroupPicker } from './MuscleGroupPicker'
import { CopyDayExercises } from './CopyDayExercises'
import { RestDayToggle } from './RestDayToggle'

export function RoutineDayPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [day, setDay] = useState<RoutineDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<RoutineExercise | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!dayId) return
    const found = await getRoutineDay(dayId)
    if (!found) {
      setError('Día no encontrado')
      setRoutine(null)
      setDay(null)
      return
    }
    setRoutine(found.routine)
    setDay(found.day)
    setLabel(found.day.label)
    setError(null)
  }, [dayId])

  useEffect(() => {
    let alive = true
    setLoading(true)
    load()
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Error al cargar el día')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [load])

  const exercises = useMemo(
    () => (day ? [...day.exercises].sort((a, b) => a.order - b.order) : []),
    [day],
  )

  async function persistLabel() {
    if (!day || !routine) return
    const next = label.trim() || weekdayLabel(day.weekday)
    if (next === day.label) return
    const updated = await updateRoutineDay(day.id, { label: next }, routine.id)
    setDay(updated)
    setLabel(updated.label)
  }

  async function persistMuscles(muscleGroups: string[]) {
    if (!day || !routine) return
    const updated = await updateRoutineDay(day.id, { muscleGroups }, routine.id)
    setDay(updated)
  }

  async function moveExercise(exerciseId: string, direction: -1 | 1) {
    if (!day || !routine) return
    const ids = exercises.map((e) => e.id)
    const index = ids.indexOf(exerciseId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return

    const next = [...ids]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBusyId(exerciseId)
    try {
      const updated = await reorderExercises(day.id, next, routine.id)
      setDay(updated)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(exerciseId: string) {
    if (!day || !routine) return
    const ok = window.confirm('¿Eliminar este ejercicio de la rutina?')
    if (!ok) return
    setBusyId(exerciseId)
    try {
      await removeExerciseFromDay(day.id, exerciseId, routine.id)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="pt-8 text-muted">Cargando día…</p>
  if (error || !day || !routine) {
    return (
      <div className="space-y-4 pt-8">
        <p className="text-danger">{error ?? 'Día no disponible'}</p>
        <Link to="/rutinas" className="font-semibold text-brand underline">
          Volver a rutinas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2 pt-2">
        <Link
          to="/rutinas"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
        >
          ← Rutinas
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {weekdayLabel(day.weekday)}
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Editar día</h1>
      </header>

      <RestDayToggle
        day={day}
        routineId={routine.id}
        onChange={(updated) => {
          setDay(updated)
          setLabel(updated.label)
        }}
      />

      {!day.isRestDay ? (
        <>
      <Card className="space-y-4">
        <TextField
          label="Nombre del día"
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => void persistLabel()}
          placeholder={weekdayLabel(day.weekday)}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Grupos musculares</p>
          <MuscleGroupPicker
            value={day.muscleGroups}
            onChange={(groups) => void persistMuscles(groups)}
          />
        </div>
      </Card>

      <CopyDayExercises
        key={`${day.id}-${day.exercises.length}-${routine.updatedAt}`}
        routine={routine}
        day={day}
        onDone={() => void load()}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">
            Ejercicios ({exercises.length})
          </h2>
          <Button
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
          >
            Agregar
          </Button>
        </div>

        {exercises.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Aún no hay ejercicios. Agrega el primero para poder entrenar este día.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {exercises.map((ex, index) => (
              <li key={ex.id}>
                <Card className="space-y-3">
                  <div className="flex gap-3">
                    <ExerciseThumb
                      routineExerciseId={ex.id}
                      name={ex.name}
                      imageUrl={ex.imageUrl}
                      hasCustomImage={ex.hasCustomImage}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-lg font-bold">{ex.name}</h3>
                      <p className="text-sm text-muted">
                        {ex.targetSets} series · {ex.targetReps.min}–{ex.targetReps.max} reps ·
                        RIR {ex.targetRir}
                      </p>
                      {ex.videoUrl ? (
                        <p className="mt-1 text-xs font-medium text-brand">Tutorial configurado</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="ghost"
                      className="px-2"
                      disabled={index === 0 || busyId === ex.id}
                      onClick={() => void moveExercise(ex.id, -1)}
                      aria-label="Subir"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2"
                      disabled={index === exercises.length - 1 || busyId === ex.id}
                      onClick={() => void moveExercise(ex.id, 1)}
                      aria-label="Bajar"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-2"
                      onClick={() => {
                        setEditing(ex)
                        setEditorOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2"
                      disabled={busyId === ex.id}
                      onClick={() => void handleRemove(ex.id)}
                    >
                      Borrar
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
        </>
      ) : null}

      {editorOpen && !day.isRestDay ? (
        <ExerciseEditor
          dayId={day.id}
          routineId={routine.id}
          exercise={editing}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
          onSaved={() => void load()}
        />
      ) : null}
    </div>
  )
}
