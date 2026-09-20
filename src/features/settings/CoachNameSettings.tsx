import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { useAuth } from '../../context/AuthProvider'
import { refreshCoachShareIfActive } from '../coach/coachShare'
import { getStoredCoachName, setStoredCoachName } from '../../utils/coachName'

export function CoachNameSettings() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [value, setValue] = useState(() => getStoredCoachName(userId))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setValue(getStoredCoachName(userId))
  }, [userId])

  async function save() {
    const next = setStoredCoachName(value, userId)
    setValue(next)
    setSaved(true)
    if (userId) void refreshCoachShareIfActive(userId)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">Nombre de tu coach</h2>
        <p className="mt-1 text-sm text-muted">
          Así aparece en el enlace: Coach · su nombre. Lo ves tú y lo ve él.
        </p>
      </div>
      <TextField
        label="Cómo se llama tu coach"
        name="coach-name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. Carlos"
        maxLength={40}
        autoComplete="off"
      />
      <Button fullWidth onClick={() => void save()} disabled={!value.trim()}>
        {saved ? 'Guardado' : 'Guardar nombre del coach'}
      </Button>
    </Card>
  )
}
