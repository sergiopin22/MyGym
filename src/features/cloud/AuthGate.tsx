import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import {
  markWeightUnitOnboardingNeeded,
  needsWeightUnitOnboarding,
} from '../../utils/weight'
import { hasPendingWeightOnboarding } from './LoginPage'
import { LoginPage } from './LoginPage'
import { WeightUnitOnboarding } from './WeightUnitOnboarding'
import { isPublicCoachSharePath } from '../coach/coachShare'

/**
 * Exige sesión, excepto el enlace público del coach.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { configured, loading, user } = useAuth()
  const { unit } = useWeightUnit()
  const publicCoach = isPublicCoachSharePath(location.pathname)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!user) return
    if (hasPendingWeightOnboarding()) {
      markWeightUnitOnboardingNeeded(user.id)
    }
  }, [user])

  useEffect(() => {
    if (!loading) {
      setSlow(false)
      return
    }
    const t = window.setTimeout(() => setSlow(true), 7000)
    return () => window.clearTimeout(t)
  }, [loading])

  if (publicCoach) return <>{children}</>

  if (!configured) return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5">
        <p className="font-display text-sm font-semibold text-muted">
          Cargando Mi Gym…
        </p>
        {slow ? (
          <>
            <p className="max-w-sm text-center text-sm text-muted">
              La nube está tardando. Recarga; si sigue igual, cierra la app y
              ábrela de nuevo.
            </p>
            <button
              type="button"
              className="min-h-11 rounded-xl bg-chrome px-5 text-sm font-semibold text-chrome-fg"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </>
        ) : null}
      </div>
    )
  }

  if (!user) return <LoginPage />

  // unit en deps: al elegir kg/lb se re-renderiza y sale del onboarding
  void unit
  if (needsWeightUnitOnboarding(user.id) || hasPendingWeightOnboarding()) {
    return <WeightUnitOnboarding />
  }

  return <>{children}</>
}
