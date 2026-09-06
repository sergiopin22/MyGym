import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { getRoutineExerciseById } from '../../db/repository'
import type { ExerciseAlternative } from '../../types'

interface MachinePickerProps {
  routineDayId: string
  routineId: string
  routineExerciseId: string
  plannedName: string
  activeAlternativeId?: string
  busy?: boolean
  onClose: () => void
  onPickOriginal: () => void
  onPickAlternative: (alternativeId: string) => void
  onCreateAlternative: (name: string) => void
}

export function MachinePicker({
  routineDayId,
  routineId,
  routineExerciseId,
  plannedName,
  activeAlternativeId,
  busy = false,
  onClose,
  onPickOriginal,
  onPickAlternative,
  onCreateAlternative,
}: MachinePickerProps) {
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[]>([])
  const [underMaintenance, setUnderMaintenance] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getRoutineExerciseById(routineExerciseId, routineDayId, routineId)
      .then((ex) => {
        if (!alive) return
        setAlternatives([...(ex?.alternatives ?? [])])
        setUnderMaintenance(Boolean(ex?.underMaintenance))
      })
      .catch(() => {
        if (alive) setError('No se pudo cargar el banco de máquinas')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [routineDayId, routineId, routineExerciseId])

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Escribe el nombre de la máquina')
      return
    }
    setError(null)
    onCreateAlternative(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-overlay sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Elegir máquina"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-elevated shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-4 pb-3 pt-4">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Mi Gym
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-fg">
            Usar otra máquina
          </h2>
          <p className="mt-1 text-sm text-muted">
            Oficial: <span className="font-semibold text-fg">{plannedName}</span>
            {underMaintenance ? ' · en mantenimiento' : ''}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted">Cargando…</p>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onPickOriginal}
                className={[
                  'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ring-2 transition active:scale-[0.99]',
                  !activeAlternativeId
                    ? 'bg-brand-soft ring-brand'
                    : 'bg-surface ring-line',
                ].join(' ')}
              >
                <span>
                  <span className="block font-display text-lg font-extrabold text-fg">
                    {plannedName}
                  </span>
                  <span className="text-sm text-muted">Máquina oficial de la rutina</span>
                </span>
                {!activeAlternativeId ? (
                  <span className="text-sm font-bold text-brand">Activa</span>
                ) : null}
              </button>

              {alternatives.length > 0 ? (
                <ul className="space-y-2">
                  {alternatives.map((alt) => {
                    const active = activeAlternativeId === alt.id
                    return (
                      <li key={alt.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onPickAlternative(alt.id)}
                          className={[
                            'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ring-2 transition active:scale-[0.99]',
                            active
                              ? 'bg-brand-soft ring-brand'
                              : 'bg-surface ring-line',
                          ].join(' ')}
                        >
                          <span>
                            <span className="block font-display text-lg font-extrabold text-fg">
                              {alt.name}
                            </span>
                            <span className="text-sm text-muted">
                              Alternativa · PR propio
                            </span>
                          </span>
                          {active ? (
                            <span className="text-sm font-bold text-brand">Activa</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-xl bg-surface px-3 py-3 text-sm text-muted">
                  No tienes alternativas guardadas. Créala aquí o en Rutinas.
                </p>
              )}

              <div className="space-y-2 border-t border-line pt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Nueva alternativa
                </p>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Remo polea"
                  className="input-ios-safe min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                />
                <Button
                  type="button"
                  fullWidth
                  variant="secondary"
                  disabled={busy || !newName.trim()}
                  onClick={handleCreate}
                >
                  Crear y usar
                </Button>
              </div>
            </>
          )}

          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        </div>

        <div className="border-t border-line px-4 py-3">
          <Button fullWidth variant="ghost" disabled={busy} onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
