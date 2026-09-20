import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { useAuth } from '../../context/AuthProvider'
import { copyToClipboard } from '../../utils/clipboard'
import { getStoredDisplayName } from '../../utils/displayName'
import {
  coachShareWhatsAppText,
  getMyCoachShare,
  isLocalShareHost,
  publishCoachShare,
  revokeCoachShare,
  type CoachShareRecord,
} from './coachShare'

export function CoachShareBar() {
  const { configured, user } = useAuth()
  const [share, setShare] = useState<CoachShareRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let alive = true
    getMyCoachShare(user.id)
      .then((row) => {
        if (alive) setShare(row)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'No se pudo leer el enlace')
        }
      })
    return () => {
      alive = false
    }
  }, [user])

  async function publish(rotateToken: boolean) {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const next = await publishCoachShare(user.id, { rotateToken })
      setShare(next)
      await copyToClipboard(next.url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el enlace')
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!share) return
    setError(null)
    try {
      await copyToClipboard(share.url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    }
  }

  async function sendWhatsApp() {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const next =
        share ?? (await publishCoachShare(user.id, { rotateToken: false }))
      setShare(next)
      window.open(
        `https://wa.me/?text=${encodeURIComponent(
          coachShareWhatsAppText(next.url, getStoredDisplayName(user.id)),
        )}`,
        '_blank',
        'noopener,noreferrer',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el enlace')
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    if (!user || !share) return
    const ok = window.confirm(
      'Si revocas el enlace, tu coach ya no podrá ver el historial con esa URL.',
    )
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await revokeCoachShare(user.id)
      setShare(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar')
    } finally {
      setBusy(false)
    }
  }

  if (!configured || !user) {
    return (
      <Card className="mt-3 space-y-2">
        <h2 className="font-display text-lg font-bold">Enlace para tu coach</h2>
        <p className="text-sm text-muted">
          Para que él lo abra en su celular, entra a tu cuenta de la nube en{' '}
          <Link to="/progreso#nube" className="font-semibold text-brand underline">
            Ajustes
          </Link>
          . Sin cuenta no se puede publicar el historial.
        </p>
      </Card>
    )
  }

  return (
    <Card className="mt-3 space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">Enlace para tu coach</h2>
        <p className="mt-1 text-sm text-muted">
          Cópialo o mándalo por WhatsApp. Él abre la misma pantalla (máquinas y
          PRs) sin instalar la app ni crear cuenta.
        </p>
      </div>

      {share ? (
        <p className="break-all rounded-2xl bg-surface px-3 py-2 text-sm font-medium text-fg ring-1 ring-line">
          {share.url}
        </p>
      ) : (
        <p className="text-sm text-muted">
          Aún no hay enlace. Créalo y se copiará solo.
        </p>
      )}

      {isLocalShareHost() ? (
        <p className="rounded-2xl bg-progress-soft px-3 py-2 text-sm text-progress">
          Esta dirección es local. Tu coach no puede abrir <span className="font-semibold">localhost</span>.
          Cuando la app esté publicada (Vercel), el enlace usará esa web. Puedes
          poner <code className="text-xs">VITE_PUBLIC_APP_URL</code> con la URL
          pública.
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          fullWidth
          disabled={busy}
          onClick={() => void (share ? copyLink() : publish(false))}
        >
          {copied
            ? '¡Copiado!'
            : share
              ? 'Copiar enlace'
              : busy
                ? 'Publicando…'
                : 'Crear y copiar enlace'}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          disabled={busy}
          onClick={() => void sendWhatsApp()}
        >
          Enviar por WhatsApp
        </Button>
      </div>

      {share ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            fullWidth
            variant="ghost"
            disabled={busy}
            onClick={() => void publish(false)}
          >
            Actualizar datos del enlace
          </Button>
          <Button
            fullWidth
            variant="ghost"
            disabled={busy}
            onClick={() => void publish(true)}
          >
            Nuevo enlace (invalida el anterior)
          </Button>
          <Button
            fullWidth
            variant="danger"
            disabled={busy}
            className="sm:col-span-2"
            onClick={() => void revoke()}
          >
            Revocar enlace
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
