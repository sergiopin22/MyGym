import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { useAuth } from '../../context/AuthProvider'
import { downloadCloudToLocal } from '../../sync/download'
import { uploadLocalToCloud } from '../../sync/upload'

type AuthMode = 'login' | 'register'

export function CloudPanel() {
  const { configured, loading, user, signIn, signUp, signOut } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAuth(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        setMessage('Sesión iniciada. Cargando datos de tu cuenta…')
      } else {
        await signUp(email, password)
        setMessage(
          'Cuenta lista. Si ya tienes datos en este celular se subirán solos; si la cuenta ya tiene datos, aparecerán aquí.',
        )
      }
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setBusy(false)
    }
  }

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
      'Bajar desde la nube reemplazará rutina, historial, meta, caminadora e imágenes en ESTE dispositivo.\n\nHaz un respaldo JSON antes si no estás seguro.\n\n¿Continuar?',
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
      setMessage('Sesión cerrada. Los datos de este dispositivo siguen aquí.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar sesión')
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">Nube (Supabase)</h2>
        <p className="text-sm text-muted">
          Falta configurar <code className="text-fg">VITE_SUPABASE_URL</code> y{' '}
          <code className="text-fg">VITE_SUPABASE_ANON_KEY</code> en{' '}
          <code className="text-fg">.env.local</code>. Reinicia Vite después de
          guardarlas.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted">Comprobando sesión…</p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Nube (multi-dispositivo)</h2>
        <p className="mt-1 text-sm text-muted">
          Al iniciar sesión se sincroniza sola tu cuenta. Los botones de abajo
          son solo por si quieres forzar una subida o bajada manual.
        </p>
      </div>

      {!user ? (
        <form className="space-y-3" onSubmit={(e) => void handleAuth(e)}>
          <div className="flex gap-2">
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1',
                mode === 'login'
                  ? 'bg-chrome text-chrome-fg ring-chrome'
                  : 'bg-surface text-muted ring-line',
              ].join(' ')}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1',
                mode === 'register'
                  ? 'bg-chrome text-chrome-fg ring-chrome'
                  : 'bg-surface text-muted ring-line',
              ].join(' ')}
              onClick={() => setMode('register')}
            >
              Crear cuenta
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Correo
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-fg outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Contraseña
            </span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-fg outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <Button type="submit" fullWidth disabled={busy}>
            {busy
              ? 'Espera…'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Registrarme'}
          </Button>
        </form>
      ) : (
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
      )}

      {step && busy ? (
        <p className="text-sm text-muted">{step}</p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm font-medium text-accent-strong">
          {message}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
