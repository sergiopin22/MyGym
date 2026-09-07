import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthProvider'
import {
  clearWeightUnitOnboarding,
  displayToLb,
  formatWeight,
  formatWeightPair,
  getStoredWeightUnit,
  lbToDisplay,
  setStoredWeightUnit,
  weightStepFor,
  weightUnitLabel,
  type WeightUnit,
} from '../utils/weight'
import { scheduleCloudSync } from '../sync/autoSync'

interface WeightUnitContextValue {
  unit: WeightUnit
  label: string
  step: number
  setUnit: (unit: WeightUnit) => void
  /** Relee localStorage (ej. tras sync de preferencias de la cuenta) */
  refreshFromStorage: () => void
  toDisplay: (lb: number | null | undefined) => number | null
  toStorage: (display: number | null | undefined) => number | null
  format: (lb: number | null | undefined) => string
  formatPair: (
    weightLb: number | null | undefined,
    reps: number | null | undefined,
  ) => string
}

const WeightUnitContext = createContext<WeightUnitContextValue | null>(null)

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [unit, setUnitState] = useState<WeightUnit>(() =>
    getStoredWeightUnit(userId),
  )

  // Cada cuenta tiene su unidad (lb o kg)
  useEffect(() => {
    setUnitState(getStoredWeightUnit(userId))
  }, [userId])

  const value = useMemo<WeightUnitContextValue>(
    () => ({
      unit,
      label: weightUnitLabel(unit),
      step: weightStepFor(unit),
      setUnit: (next) => {
        setStoredWeightUnit(next, true, userId)
        clearWeightUnitOnboarding(userId)
        setUnitState(next)
        scheduleCloudSync({ delayMs: 1500 })
      },
      refreshFromStorage: () => {
        setUnitState(getStoredWeightUnit(userId))
      },
      toDisplay: (lb) => lbToDisplay(lb, unit),
      toStorage: (display) => displayToLb(display, unit),
      format: (lb) => formatWeight(lb, unit),
      formatPair: (w, r) => formatWeightPair(w, r, unit),
    }),
    [unit, userId],
  )

  return (
    <WeightUnitContext.Provider value={value}>
      {children}
    </WeightUnitContext.Provider>
  )
}

export function useWeightUnit() {
  const ctx = useContext(WeightUnitContext)
  if (!ctx) {
    throw new Error('useWeightUnit debe usarse dentro de WeightUnitProvider')
  }
  return ctx
}
