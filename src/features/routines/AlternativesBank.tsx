import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import {
  listSharedAlternatives,
  removeExerciseAlternative,
  unifyAlternativeBank,
  type SharedAlternativeRow,
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
  const [rows, setRows] = useState<SharedAlternativeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [unifying, setUnifying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const next = await listSharedAlternatives(routineId)
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

  const hasDuplicates = rows.some(
    (row) => row.days.length > 1 || row.otherNames.length > 0,
  )

  async function handleUnify() {
    const ok = window.confirm(
      'Esto deja una sola alternativa por máquina en todos los días y junta el historial de nombres parecidos (por ejemplo Predicador máquina polea y Predicador Polea Máquina).\n\n¿Unir duplicados?',
    )
    if (!ok) return
    setUnifying(true)
    setError(null)
    setNotice(null)
    try {
      const result = await unifyAlternativeBank(routineId)
      await load()
      setNotice(
        result.sessionsUpdated > 0
          ? `Listo: se unieron ${result.copiesRemoved} copias y ${result.sessionsUpdated} entreno(s) ahora cuentan juntos.`
          : `Listo: se unieron ${result.copiesRemoved} copias. El historial ya comparte el mismo nombre.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron unir')
    } finally {
      setUnifying(false)
    }
  }

  async function handleRemove(row: SharedAlternativeRow) {
    const first = row.days[0]
    if (!first) return
    const ok = window.confirm(
      `¿Quitar "${row.alternativeName}" del banco de "${row.officialName}" en todos los días?\n\nYa no la podrás elegir en el gym. Los entrenos que ya hiciste se quedan.`,
    )
    if (!ok) return
    const key = `${row.officialName}::${row.alternativeName}`
    setBusyKey(key)
    setError(null)
    try {
      await removeExerciseAlternative(
        first.dayId,
        first.exerciseId,
        first.alternativeId,
        routineId,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold">Máquinas alternativas</h2>
        <p className="mt-1 text-sm text-muted">
          Una por máquina, para todos los días que la entrenes. No hace falta
          crearla otra vez el martes y el viernes.
        </p>
      </div>

      {hasDuplicates ? (
        <Card className="space-y-3">
          <p className="text-sm text-fg">
            Hay alternativas repetidas en varios días o con otro nombre. Únelas
            para que el historial y los PRs cuenten como una sola máquina.
          </p>
          <Button
            fullWidth
            disabled={unifying}
            onClick={() => void handleUnify()}
          >
            {unifying ? 'Uniendo…' : 'Unir duplicados'}
          </Button>
        </Card>
      ) : null}

      {notice ? (
        <p className="text-sm font-medium text-brand">{notice}</p>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando alternativas…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No hay alternativas todavía. Se crean al editar un ejercicio o en el
            gym si cambias de máquina. Queda disponible en todos los días de esa
            máquina.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const key = `${row.officialName}::${row.alternativeName}`
            const dayText = uniqueDayLabels(row).join(' · ')
            return (
              <li key={key}>
                <Card className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-fg">
                      {row.alternativeName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      Sustituye a {row.officialName}
                      {dayText ? ` · ${dayText}` : ''}
                    </p>
                    {row.otherNames.length > 0 ? (
                      <p className="mt-0.5 text-xs font-medium text-danger">
                        También como: {row.otherNames.join(' · ')}
                      </p>
                    ) : null}
                    {row.sessionCount > 0 ? (
                      <p className="mt-0.5 text-xs text-muted">
                        {row.sessionCount === 1
                          ? '1 entreno'
                          : `${row.sessionCount} entrenos`}
                      </p>
                    ) : null}
                    {row.days[0] ? (
                      <Link
                        to={`/rutinas/${row.days[0].dayId}`}
                        className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-brand-strong"
                      >
                        Ver el día
                      </Link>
                    ) : null}
                  </div>
                  <Button
                    variant="danger"
                    className="shrink-0 px-3"
                    disabled={busyKey === key}
                    onClick={() => void handleRemove(row)}
                  >
                    {busyKey === key ? '…' : 'Quitar'}
                  </Button>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function uniqueDayLabels(row: SharedAlternativeRow): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const day of row.days) {
    const label = weekdayLabel(day.weekday)
    if (seen.has(label)) continue
    seen.add(label)
    labels.push(label)
  }
  return labels
}
