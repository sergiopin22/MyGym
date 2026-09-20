import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { useAuth } from '../../context/AuthProvider'
import { refreshCoachShareIfActive } from '../coach/coachShare'
import { getStoredCoachName, setStoredCoachName } from '../../utils/coachName'

export function CoachNamePrompt({
  onSaved,
}: {
  onSaved?: (name: string) => void
}) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done || getStoredCoachName(userId)) return null

  function save() {
    const next = setStoredCoachName(value, userId)
    if (!next) {
      setError('Escribe el nombre de tu coach.')
      return
    }
    setError(null)
    if (userId) void refreshCoachShareIfActive(userId)
    setDone(true)
    onSaved?.(next)
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Vista coach
        </p>
        <h2 className="font-display text-lg font-bold">¿Cómo se llama tu coach?</h2>
        <p className="mt-1 text-sm text-muted">
          Así sale en el enlace: Coach · su nombre. Luego lo cambias en Ajustes.
        </p>
      </div>
      <TextField
        label="Nombre de tu coach"
        name="coach-name-prompt"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. Carlos"
        maxLength={40}
        autoComplete="off"
      />
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <Button fullWidth onClick={save}>
        Guardar
      </Button>
    </Card>
  )
}
