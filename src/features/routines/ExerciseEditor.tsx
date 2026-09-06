import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { NumberStepper } from '../../components/NumberStepper'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import {
  addExerciseAlternative,
  addExerciseGrip,
  addExerciseToDay,
  clearExerciseImage,
  listSessionsTaggedAsOfficialMachine,
  removeExerciseAlternative,
  removeExerciseGrip,
  renameExerciseAlternative,
  renameExerciseGrip,
  reassignRecentSessionsToAlternative,
  saveExerciseImage,
  setExerciseUnderMaintenance,
  updateExercise,
} from '../../db/repository'
import type { ExerciseAlternative, ExerciseGrip, RoutineExercise } from '../../types'
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
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[]>(
    () => [...(exercise?.alternatives ?? [])],
  )
  const [grips, setGrips] = useState<ExerciseGrip[]>(
    () => [...(exercise?.grips ?? [])],
  )
  const [underMaintenance, setUnderMaintenance] = useState(
    Boolean(exercise?.underMaintenance),
  )
  const [newAltName, setNewAltName] = useState('')
  const [newGripName, setNewGripName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function ensureExerciseSaved(): Promise<string> {
    if (exerciseId) return exerciseId
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
    setExerciseId(created.id)
    setName(created.name)
    return created.id
  }

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
        underMaintenance: underMaintenance || undefined,
      }

      if (isEdit && exercise) {
        await updateExercise(dayId, exercise.id, payload, routineId)
      } else {
        const created = await addExerciseToDay(dayId, payload, routineId)
        setExerciseId(created.id)
        if (underMaintenance) {
          await setExerciseUnderMaintenance(dayId, created.id, true, routineId)
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddAlternative() {
    setSaving(true)
    setError(null)
    try {
      const id = await ensureExerciseSaved()
      const updated = await addExerciseAlternative(
        dayId,
        id,
        newAltName,
        routineId,
      )
      setAlternatives([...(updated.alternatives ?? [])])
      setNewAltName('')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveAlternative(alternativeId: string) {
    if (!exerciseId) return
    const ok = window.confirm('¿Quitar esta máquina alternativa del banco?')
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      const updated = await removeExerciseAlternative(
        dayId,
        exerciseId,
        alternativeId,
        routineId,
      )
      setAlternatives([...(updated.alternatives ?? [])])
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setSaving(false)
    }
  }

  async function handleRenameAlternative(alternativeId: string, current: string) {
    if (!exerciseId) return
    const next = window.prompt('Nuevo nombre de la máquina alternativa', current)
    if (next == null) return
    setSaving(true)
    setError(null)
    try {
      const updated = await renameExerciseAlternative(
        dayId,
        exerciseId,
        alternativeId,
        next,
        routineId,
      )
      setAlternatives([...(updated.alternatives ?? [])])
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar')
    } finally {
      setSaving(false)
    }
  }

  async function handleReassignHistory(alt: ExerciseAlternative) {
    if (!exerciseId) return
    const official = name.trim() || exercise?.name || ''
    if (!official) {
      setError('Guarda primero el nombre oficial del ejercicio')
      return
    }

    const raw = window.prompt(
      `¿Cuántas sesiones recientes de "${official}" quieres mover a "${alt.name}"?\n\n(Esas sesiones pasarán a contar como la alternativa: última vez y PR propios.)`,
      '3',
    )
    if (raw == null) return
    const sessionCount = Number.parseInt(raw, 10)
    if (!Number.isFinite(sessionCount) || sessionCount < 1) {
      setError('Indica un número válido (ej. 3)')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const preview = await listSessionsTaggedAsOfficialMachine({
        routineExerciseId: exerciseId,
        officialName: official,
        limit: sessionCount,
      })
      if (preview.length === 0) {
        throw new Error(
          `No hay sesiones guardadas como "${official}" para mover.`,
        )
      }
      const dates = preview
        .map((p) =>
          new Date(p.date + 'T12:00:00').toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        )
        .join('\n')
      const ok = window.confirm(
        `Se moverán ${preview.length} sesión(es) de "${official}" → "${alt.name}":\n\n${dates}\n\n¿Continuar?`,
      )
      if (!ok) return

      const result = await reassignRecentSessionsToAlternative({
        routineExerciseId: exerciseId,
        officialName: official,
        alternativeId: alt.id,
        alternativeName: alt.name,
        sessionCount,
      })
      window.alert(
        `Listo: ${result.updatedSessions} sesión(es) ahora cuentan como "${alt.name}".\n"${official}" recupera su historial anterior.`,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reclasificar')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddGrip() {
    setSaving(true)
    setError(null)
    try {
      const id = await ensureExerciseSaved()
      const updated = await addExerciseGrip(dayId, id, newGripName, routineId)
      setGrips([...(updated.grips ?? [])])
      setNewGripName('')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveGrip(gripId: string) {
    if (!exerciseId) return
    const ok = window.confirm('¿Quitar este agarre?')
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      const updated = await removeExerciseGrip(
        dayId,
        exerciseId,
        gripId,
        routineId,
      )
      setGrips([...(updated.grips ?? [])])
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setSaving(false)
    }
  }

  async function handleRenameGrip(gripId: string, current: string) {
    if (!exerciseId) return
    const next = window.prompt('Nuevo nombre del agarre', current)
    if (next == null) return
    setSaving(true)
    setError(null)
    try {
      const updated = await renameExerciseGrip(
        dayId,
        exerciseId,
        gripId,
        next,
        routineId,
      )
      setGrips([...(updated.grips ?? [])])
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleMaintenance() {
    const next = !underMaintenance
    setUnderMaintenance(next)
    if (!exerciseId) return
    setSaving(true)
    setError(null)
    try {
      await setExerciseUnderMaintenance(dayId, exerciseId, next, routineId)
      onSaved()
    } catch (err) {
      setUnderMaintenance(!next)
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
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
      const id = await ensureExerciseSaved()
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-0 sm:items-center sm:p-4">
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

          <section className="space-y-3 rounded-2xl border border-line bg-surface px-3 py-3">
            <div>
              <p className="font-display text-sm font-bold text-fg">
                Máquinas alternativas
              </p>
              <p className="mt-1 text-xs text-muted">
                Créalas aquí con calma. En el gym solo eliges cuál usas si la
                oficial está en mantenimiento.
              </p>
            </div>

            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-fg">
              <input
                type="checkbox"
                checked={underMaintenance}
                onChange={() => void handleToggleMaintenance()}
                className="h-5 w-5 accent-[var(--color-brand)]"
              />
              Máquina oficial en mantenimiento
            </label>

            {alternatives.length > 0 ? (
              <ul className="space-y-2">
                {alternatives.map((alt) => (
                  <li
                    key={alt.id}
                    className="space-y-2 rounded-xl bg-surface-elevated px-3 py-2 ring-1 ring-line"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-semibold text-fg">
                        {alt.name}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand"
                        disabled={saving}
                        onClick={() => void handleRenameAlternative(alt.id, alt.name)}
                      >
                        Renombrar
                      </button>
                      <button
                        type="button"
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-danger"
                        disabled={saving}
                        onClick={() => void handleRemoveAlternative(alt.id)}
                      >
                        Quitar
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={saving || !exerciseId}
                      onClick={() => void handleReassignHistory(alt)}
                      className="w-full rounded-xl bg-brand-soft px-3 py-2 text-left text-xs font-semibold text-fg ring-1 ring-brand/30 transition active:scale-[0.99] disabled:opacity-50"
                    >
                      Mover últimas sesiones aquí
                      <span className="mt-0.5 block font-normal text-muted">
                        Corrige historial: pesos que guardaste como la oficial pasan a esta alternativa
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Aún no hay alternativas. Ej: Remo polea, Curl polea…
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newAltName}
                onChange={(e) => setNewAltName(e.target.value)}
                placeholder="Nombre de la alternativa"
                className="input-ios-safe min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface-elevated px-3 text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={saving || !newAltName.trim()}
                onClick={() => void handleAddAlternative()}
              >
                Agregar
              </Button>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-line bg-surface px-3 py-3">
            <div>
              <p className="font-display text-sm font-bold text-fg">Agarres</p>
              <p className="mt-1 text-xs text-muted">
                Variantes del mismo movimiento (ej. barra multi / barra recta).
                En el gym eliges con un toque; cada agarre tiene su PR.
              </p>
            </div>

            {grips.length > 0 ? (
              <ul className="space-y-2">
                {grips.map((grip) => (
                  <li
                    key={grip.id}
                    className="flex items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2 ring-1 ring-line"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold text-fg">
                      {grip.name}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand"
                      disabled={saving}
                      onClick={() => void handleRenameGrip(grip.id, grip.name)}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-danger"
                      disabled={saving}
                      onClick={() => void handleRemoveGrip(grip.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Opcional. Ej: Barra multi agarre, Barra recta…
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newGripName}
                onChange={(e) => setNewGripName(e.target.value)}
                placeholder="Nombre del agarre"
                className="input-ios-safe min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface-elevated px-3 text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={saving || !newGripName.trim()}
                onClick={() => void handleAddGrip()}
              >
                Agregar
              </Button>
            </div>
          </section>

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
