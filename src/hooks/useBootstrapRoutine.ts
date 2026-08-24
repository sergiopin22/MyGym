import { useEffect, useState } from 'react'
import { ensureDefaultRoutine } from '../db/repository'
import type { Routine } from '../types'

export function useBootstrapRoutine() {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ensureDefaultRoutine()
      .then((r) => {
        if (alive) setRoutine(r)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Error al iniciar la base de datos')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { routine, loading, error, setRoutine }
}
