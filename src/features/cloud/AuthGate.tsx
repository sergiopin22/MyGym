import { useEffect, type ReactNode } from 'react'
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

  useEffect(() => {
    if (!user) return
    if (hasPendingWeightOnboarding()) {
      markWeightUnitOnboardingNeeded(user.id)
    }
  }, [user])

  if (publicCoach) return <>{children}</>

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

  // unit en deps: al elegir kg/lb se re-renderiza y sale del onboarding
  void unit
  if (needsWeightUnitOnboarding(user.id) || hasPendingWeightOnboarding()) {
    return <WeightUnitOnboarding />
  }

  return <>{children}</>
}
