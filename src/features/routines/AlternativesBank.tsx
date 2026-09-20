import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import {
  listRoutineAlternatives,
  removeExerciseAlternative,
  type RoutineAlternativeRow,
} from '../../db/repository'
import { weekdayLabel } from '../../utils/id'

interface AlternativesBankProps {
  routineId: string
  routineUpdatedAt: number
}

export function AlternativesBank({
  routineId,
  routineUpdatedAt,
}: AlternativesBankProps) {
  const [rows, setRows] = useState<RoutineAlternativeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const next = await listRoutineAlternatives(routineId)
    setRows(next)
    setError(null)
  }, [routineId])

  useEffect(() => {
    let alive = true
    setLoading(true)
    load()
      .catch((err: unknown) => {
        if (alive) {
          setError(
            err instanceof Error ? err.message : 'No se pudieron cargar las alternativas',
          )
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [load, routineUpdatedAt])

  async function handleRemove(row: RoutineAlternativeRow) {
    const ok = window.confirm(
      `¿Quitar "${row.alternative.name}" del banco de "${row.officialName}"?\n\nYa no la podrás elegir en el gym. Los entrenos que ya hiciste en esa máquina se quedan en el historial.`,
    )
    if (!ok) return
    setBusyId(row.alternative.id)
    setError(null)
    try {
      await removeExerciseAlternative(
        row.dayId,
        row.exerciseId,
        row.alternative.id,
        routineId,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold">Máquinas alternativas</h2>
        <p className="mt-1 text-sm text-muted">
          Sustitutas si la oficial está en mantenimiento. Aquí las ves todas y
          puedes borrar la que no necesites.
        </p>
      </div>

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando alternativas…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No hay alternativas todavía. Se crean al editar un ejercicio o en el
            gym si cambias de máquina.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={`${row.exerciseId}-${row.alternative.id}`}>
              <Card className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-fg">
                    {row.alternative.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Sustituye a {row.officialName} · {weekdayLabel(row.weekday)}
                    {row.dayLabel !== weekdayLabel(row.weekday)
                      ? ` · ${row.dayLabel}`
                      : ''}
                  </p>
                  <Link
                    to={`/rutinas/${row.dayId}`}
                    className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-brand-strong"
                  >
                    Ver el día
                  </Link>
                </div>
                <Button
                  variant="danger"
                  className="shrink-0 px-3"
                  disabled={busyId === row.alternative.id}
                  onClick={() => void handleRemove(row)}
                >
                  {busyId === row.alternative.id ? '…' : 'Quitar'}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
