import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { LoginPage } from './LoginPage'

/**
 * Si Supabase está configurado, exige sesión antes de mostrar la app.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth()

  if (!configured) return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5">
        <p className="font-display text-sm font-semibold text-muted">
          Cargando Mi Gym…
        </p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <>{children}</>
}
