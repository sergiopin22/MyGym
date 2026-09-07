import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { useAuth } from '../../context/AuthProvider'

type AuthMode = 'login' | 'register'

/** Pantalla de entrada: sin sesión no se entra a la app. */
export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-[#070707] px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <header className="text-center">
          <img
            src="/brand/my-gym-logo.jpg"
            alt="My Gym"
            className="mx-auto h-44 w-44 object-cover drop-shadow-[0_24px_48px_rgba(220,30,40,0.35)]"
          />
          <h1 className="sr-only">Mi Gym</h1>
          <p className="mt-5 text-sm text-muted">
            Entra con tu cuenta para ver tu rutina, historial y progreso en este
            dispositivo.
          </p>
        </header>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex gap-2">
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition',
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
                'flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition',
                mode === 'register'
                  ? 'bg-chrome text-chrome-fg ring-chrome'
                  : 'bg-surface text-muted ring-line',
              ].join(' ')}
              onClick={() => setMode('register')}
            >
              Crear cuenta
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Correo
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface-elevated px-4 py-3.5 text-fg outline-none focus:ring-2 focus:ring-brand"
              placeholder="tu@email.com"
            />
          </label>

          <label className="block space-y-1.5">
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
              className="w-full rounded-2xl border border-line bg-surface-elevated px-4 py-3.5 text-fg outline-none focus:ring-2 focus:ring-brand"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <Button type="submit" fullWidth disabled={busy}>
            {busy
              ? 'Entrando…'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta y entrar'}
          </Button>

          {error ? (
            <p className="text-center text-sm font-medium text-danger">{error}</p>
          ) : null}
        </form>
      </div>
    </div>
  )
}
