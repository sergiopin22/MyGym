import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { useAuth } from '../../context/AuthProvider'
import { scheduleCloudSync } from '../../sync/autoSync'
import { refreshCoachShareIfActive } from '../coach/coachShare'
import {
  getStoredDisplayName,
  setStoredDisplayName,
} from '../../utils/displayName'

export function DisplayNamePrompt({
  onSaved,
}: {
  onSaved?: (name: string) => void
}) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done || getStoredDisplayName(userId)) return null

  function save() {
    const next = setStoredDisplayName(value, userId)
    if (!next) {
      setError('Escribe tu nombre para que el coach sepa quién eres.')
      return
    }
    setError(null)
    scheduleCloudSync({ delayMs: 800 })
    if (userId) void refreshCoachShareIfActive(userId)
    setDone(true)
    onSaved?.(next)
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Para tu coach
        </p>
        <h2 className="font-display text-lg font-bold">¿Cómo te llamas?</h2>
        <p className="mt-1 text-sm text-muted">
          Se muestra en la vista coach. Luego lo cambias en Ajustes.
        </p>
      </div>
      <TextField
        label="Tu nombre"
        name="display-name-prompt"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. Alejandro"
        maxLength={40}
        autoComplete="nickname"
      />
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <Button fullWidth onClick={save}>
        Guardar
      </Button>
    </Card>
  )
}
