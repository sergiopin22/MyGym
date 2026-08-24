import { useState } from 'react'
import { Button } from '../../components/Button'
import { getSessionDetail } from '../../db/repository'
import type { SessionSummary, WorkoutSession } from '../../types'
import { formatWorkoutForCoach } from '../../utils/coachMessage'
import { copyToClipboard } from '../../utils/clipboard'

interface CopyCoachMessageButtonProps {
  session?: WorkoutSession
  sessionId?: string
  summary?: SessionSummary
  fullWidth?: boolean
  className?: string
}

export function CopyCoachMessageButton({
  session: sessionProp,
  sessionId,
  summary,
  fullWidth,
  className = '',
}: CopyCoachMessageButtonProps) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCopy() {
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      let session = sessionProp
      if (!session) {
        const id = sessionId ?? summary?.sessionId
        if (!id) throw new Error('Sesión no disponible')
        session = await getSessionDetail(id)
      }
      if (!session) throw new Error('Sesión no encontrada')

      const text = formatWorkoutForCoach(session)
      await copyToClipboard(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setBusy(false)
    }
  }

  const label = done
    ? '¡Copiado!'
    : busy
      ? 'Copiando…'
      : summary
        ? 'Copiar entrenamiento'
        : 'Copiar para mi coach'

  return (
    <div className={className}>
      <Button
        variant={done ? 'secondary' : 'primary'}
        fullWidth={fullWidth}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void handleCopy()
        }}
      >
        {label}
      </Button>
      {error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  )
}
