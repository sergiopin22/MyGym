import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { NumberStepper } from '../../components/NumberStepper'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import {
  addExerciseToDay,
  clearExerciseImage,
  saveExerciseImage,
  updateExercise,
} from '../../db/repository'
import type { RoutineExercise } from '../../types'
import { openTutorial } from '../exercises/media'

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

interface ExerciseEditorProps {
  dayId: string
  routineId: string
  exercise?: RoutineExercise | null
  onClose: () => void
  onSaved: () => void
}

export function ExerciseEditor({
  dayId,
  routineId,
  exercise,
  onClose,
  onSaved,
}: ExerciseEditorProps) {
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = Boolean(exercise)

  const [name, setName] = useState(exercise?.name ?? '')
  const [targetSets, setTargetSets] = useState(exercise?.targetSets ?? 3)
  const [repsMin, setRepsMin] = useState(exercise?.targetReps.min ?? 8)
  const [repsMax, setRepsMax] = useState(exercise?.targetReps.max ?? 12)
  const [targetRir, setTargetRir] = useState(exercise?.targetRir ?? 2)
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '')
  const [imageUrl, setImageUrl] = useState(exercise?.imageUrl ?? '/exercises/default.svg')
  const [hasCustomImage, setHasCustomImage] = useState(Boolean(exercise?.hasCustomImage))
  const [exerciseId, setExerciseId] = useState(exercise?.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Ponle un nombre al ejercicio')
      return
    }

    const sets = clampInt(targetSets, 1, 12)
    const minReps = clampInt(repsMin, 1, 12)
    const maxReps = clampInt(repsMax, 1, 12)
    const rir = clampInt(targetRir, 0, 12)

    if (minReps > maxReps) {
      setError('Reps min no puede ser mayor que reps max')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: trimmed,
        targetSets: sets,
        targetReps: { min: minReps, max: maxReps },
        targetRir: rir,
        videoUrl: videoUrl.trim() || undefined,
        imageUrl,
        hasCustomImage,
      }

      if (isEdit && exercise) {
        await updateExercise(dayId, exercise.id, payload, routineId)
      } else {
        const created = await addExerciseToDay(dayId, payload, routineId)
        setExerciseId(created.id)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleImagePick(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen')
      return
    }

    setSaving(true)
    setError(null)
    try {
      let id = exerciseId
      if (!id) {
        const trimmed = name.trim() || 'Nuevo ejercicio'
        const created = await addExerciseToDay(
          dayId,
          {
            name: trimmed,
            targetSets,
            targetReps: { min: repsMin, max: repsMax },
            targetRir,
            videoUrl: videoUrl.trim() || undefined,
          },
          routineId,
        )
        id = created.id
        setExerciseId(id)
        setName(created.name)
      }
      await saveExerciseImage(id, file, dayId, routineId)
      setHasCustomImage(true)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la imagen')
    } finally {
      setSaving(false)
    }
  }

  async function handleClearImage() {
    if (!exerciseId) return
    setSaving(true)
    try {
      await clearExerciseImage(exerciseId, dayId, routineId)
      setHasCustomImage(false)
      setImageUrl('/exercises/default.svg')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la imagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-elevated shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-full text-muted hover:bg-line/70 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          {exerciseId ? (
            <div className="flex items-center gap-3">
              <ExerciseThumb
                routineExerciseId={exerciseId}
                name={name || 'Ejercicio'}
                imageUrl={imageUrl}
                hasCustomImage={hasCustomImage}
                size="lg"
              />
              <div className="flex flex-1 flex-col gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                >
                  Cambiar imagen
                </Button>
                {hasCustomImage ? (
                  <Button variant="ghost" type="button" onClick={() => void handleClearImage()}>
                    Usar imagen por defecto
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void handleImagePick(e.target.files?.[0])}
              />
            </div>
          ) : (
            <p className="rounded-2xl bg-surface px-3 py-3 text-sm text-muted">
              Guarda el ejercicio o súbele una foto para fijar la imagen de la máquina.
            </p>
          )}

          <TextField
            label="Nombre"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Press banca"
            autoFocus
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberStepper
              label="Series"
              value={targetSets}
              min={1}
              max={12}
              allowEmpty={false}
              onChange={(v) => setTargetSets(v ?? 1)}
            />
            <NumberStepper
              label="Reps min"
              value={repsMin}
              min={1}
              max={12}
              allowEmpty={false}
              onChange={(v) => setRepsMin(v ?? 1)}
            />
            <NumberStepper
              label="Reps max"
              value={repsMax}
              min={1}
              max={12}
              allowEmpty={false}
              onChange={(v) => setRepsMax(v ?? 12)}
            />
          </div>

          <NumberStepper
            label="RIR objetivo"
            value={targetRir}
            min={0}
            max={12}
            allowEmpty={false}
            onChange={(v) => setTargetRir(v ?? 2)}
          />
          <p className="text-xs text-muted">
            Series y reps: 1–12. RIR: 0–12 (0 = al fallo). Usa + / − o escribe el número.
          </p>

          <TextField
            label="Video tutorial (URL)"
            name="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />

          {videoUrl.trim() ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => openTutorial(videoUrl.trim())}
            >
              Ver tutorial
            </Button>
          ) : null}

          {!exerciseId ? (
            <div>
              <Button
                variant="secondary"
                type="button"
                fullWidth
                onClick={() => fileRef.current?.click()}
                disabled={saving}
              >
                Subir foto de la máquina
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void handleImagePick(e.target.files?.[0])}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        </div>

        <div className="flex gap-2 border-t border-line p-4">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button fullWidth onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
