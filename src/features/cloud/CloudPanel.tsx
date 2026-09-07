import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { useAuth } from '../../context/AuthProvider'
import { downloadCloudToLocal } from '../../sync/download'
import { uploadLocalToCloud } from '../../sync/upload'

export function CloudPanel() {
  const { configured, user, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload() {
    if (!user) return
    setBusy(true)
    setError(null)
    setMessage(null)
    setStep(null)
    try {
      const stats = await uploadLocalToCloud(user.id, setStep)
      setMessage(
        `Subido a la nube: ${stats.routines} rutina(s), ${stats.sessions} sesión(es), ${stats.goals} meta(s), ${stats.treadmill} caminadora(s), ${stats.media} archivo(s). Lo local no se borró.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir')
    } finally {
      setBusy(false)
      setStep(null)
    }
  }

  async function handleDownload() {
    if (!user) return
    const ok = window.confirm(
      'Bajar desde la nube reemplazará rutina, historial, meta, caminadora e imágenes en ESTE dispositivo.\n\n¿Continuar?',
    )
    if (!ok) return

    setBusy(true)
    setError(null)
    setMessage(null)
    setStep(null)
    try {
      const stats = await downloadCloudToLocal(user.id, setStep)
      setMessage(
        `Descargado: ${stats.routines} rutina(s), ${stats.sessions} sesión(es), ${stats.goals} meta(s), ${stats.treadmill} caminadora(s), ${stats.media} archivo(s). Recargando…`,
      )
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo bajar')
      setBusy(false)
      setStep(null)
    }
  }

  async function handleSignOut() {
    setBusy(true)
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar sesión')
      setBusy(false)
    }
  }

  if (!configured || !user) {
    return null
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Cuenta y sync</h2>
        <p className="mt-1 text-sm text-muted">
          Los cambios (entrenos, meta, caminadora, rutina…) se suben solos a tu
          cuenta unos segundos después. Estos botones son solo por si quieres
          forzar ahora.
        </p>
      </div>

      <div className="space-y-3">
        <p className="rounded-2xl bg-brand-soft px-3 py-2 text-sm text-fg">
          Conectado: <span className="font-semibold">{user.email}</span>
        </p>

        <Button fullWidth disabled={busy} onClick={() => void handleUpload()}>
          {busy && step ? step : 'Forzar subida a la cuenta'}
        </Button>

        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => void handleDownload()}
        >
          Forzar bajar cuenta (reemplaza este dispositivo)
        </Button>

        <Button
          variant="ghost"
          fullWidth
          disabled={busy}
          onClick={() => void handleSignOut()}
        >
          Cerrar sesión
        </Button>
      </div>

      {step && busy ? <p className="text-sm text-muted">{step}</p> : null}
      {message ? (
        <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm font-medium text-accent-strong">
          {message}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
