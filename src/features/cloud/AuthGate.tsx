import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import {
  markWeightUnitOnboardingNeeded,
  needsWeightUnitOnboarding,
} from '../../utils/weight'
import { hasPendingWeightOnboarding } from './LoginPage'
import { LoginPage } from './LoginPage'
import { WeightUnitOnboarding } from './WeightUnitOnboarding'

/**
 * Exige sesión. Tras crear cuenta, pide lb/kg (queda guardado por usuario).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth()
  const { unit } = useWeightUnit()

  useEffect(() => {
    if (!user) return
    if (hasPendingWeightOnboarding()) {
      markWeightUnitOnboardingNeeded(user.id)
    }
  }, [user])

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
