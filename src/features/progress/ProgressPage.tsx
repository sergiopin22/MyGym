import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card } from '../../components/Card'
import { BackupPanel } from '../backup/BackupPanel'
import { ThemePicker } from '../settings/ThemePicker'
import { BodyCheckInPanel } from './BodyCheckInPanel'
import { getRecentImprovements } from '../../db/repository'
import type { Improvement } from '../../types'

export function ProgressPage() {
  const location = useLocation()
  const [items, setItems] = useState<Improvement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (location.hash === '#temas' || location.hash === '#checkin') {
      window.setTimeout(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [location.hash])

  useEffect(() => {
    let alive = true
    getRecentImprovements(40)
      .then((rows) => {
        if (alive) setItems(rows)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <p className="pt-8 text-muted">Cargando progreso…</p>

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Progreso</h1>
        <p className="mt-1 text-muted">
          Check-in físico, temas, respaldo y mejoras.
        </p>
      </header>

      <BodyCheckInPanel />

      <div id="temas">
        <ThemePicker />
      </div>

      <BackupPanel />

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            Cuando superes peso o reps respecto a la última vez, aparecerán aquí.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{item.exerciseName}</h2>
                  <time className="shrink-0 text-xs text-muted">
                    {new Date(item.detectedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </time>
                </div>
                <p className="text-sm font-medium text-ink">{item.message}</p>
                <Link
                  to={`/historial/${item.sessionId}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
                >
                  Ver sesión
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
