import { useEffect, useState } from 'react'
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

export function DisplayNameSettings() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [value, setValue] = useState(() => getStoredDisplayName(userId))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setValue(getStoredDisplayName(userId))
  }, [userId])

  async function save() {
    const next = setStoredDisplayName(value, userId)
    setValue(next)
    setSaved(true)
    scheduleCloudSync({ delayMs: 800 })
    if (userId) void refreshCoachShareIfActive(userId)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">Tu nombre</h2>
        <p className="mt-1 text-sm text-muted">
          Lo ve tu coach en el enlace. Puedes cambiarlo cuando quieras; no queda
          fijo para siempre.
        </p>
      </div>
      <TextField
        label="Cómo te llaman"
        name="display-name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. Alejandro"
        maxLength={40}
        autoComplete="nickname"
      />
      <Button fullWidth onClick={() => void save()} disabled={!value.trim()}>
        {saved ? 'Guardado' : 'Guardar nombre'}
      </Button>
    </Card>
  )
}
