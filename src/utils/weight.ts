/** Canónico en DB: siempre libras (lb). La UI muestra lb o kg según la cuenta. */

export type WeightUnit = 'lb' | 'kg'

const UNIT_KEY = 'mi-gym-weight-unit'
const CHOSEN_KEY = 'mi-gym-weight-unit-chosen'
const ONBOARDING_KEY = 'mi-gym-weight-unit-onboarding'

export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'lb'

/** 1 kg = 2.2046226218 lb */
export const LB_PER_KG = 2.2046226218

function unitKey(userId?: string | null) {
  return userId ? `${UNIT_KEY}:${userId}` : UNIT_KEY
}

function chosenKey(userId?: string | null) {
  return userId ? `${CHOSEN_KEY}:${userId}` : CHOSEN_KEY
}

function onboardingKey(userId?: string | null) {
  return userId ? `${ONBOARDING_KEY}:${userId}` : ONBOARDING_KEY
}

export function isWeightUnit(value: string): value is WeightUnit {
  return value === 'lb' || value === 'kg'
}

export function getStoredWeightUnit(userId?: string | null): WeightUnit {
  try {
    if (userId) {
      const scoped = localStorage.getItem(unitKey(userId))
      if (scoped && isWeightUnit(scoped)) return scoped
    }
    // Legacy (sin userId): solo default lb
    const legacy = localStorage.getItem(UNIT_KEY)
    if (!userId && legacy && isWeightUnit(legacy)) return legacy
  } catch {
    /* ignore */
  }
  return DEFAULT_WEIGHT_UNIT
}

export function hasChosenWeightUnit(userId?: string | null): boolean {
  try {
    if (userId && localStorage.getItem(chosenKey(userId)) === '1') return true
    if (!userId && localStorage.getItem(CHOSEN_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  return false
}

export function setStoredWeightUnit(
  unit: WeightUnit,
  markChosen = true,
  userId?: string | null,
): void {
  try {
    localStorage.setItem(unitKey(userId), unit)
    if (markChosen) localStorage.setItem(chosenKey(userId), '1')
  } catch {
    /* ignore */
  }
}

export function needsWeightUnitOnboarding(userId?: string | null): boolean {
  try {
    return localStorage.getItem(onboardingKey(userId)) === '1'
  } catch {
    return false
  }
}

export function markWeightUnitOnboardingNeeded(userId?: string | null): void {
  try {
    localStorage.setItem(onboardingKey(userId), '1')
  } catch {
    /* ignore */
  }
}

export function clearWeightUnitOnboarding(userId?: string | null): void {
  try {
    localStorage.removeItem(onboardingKey(userId))
  } catch {
    /* ignore */
  }
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'kg' : 'lb'
}

export function weightStepFor(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5
}

/** lb (DB) → valor para mostrar */
export function lbToDisplay(
  lb: number | null | undefined,
  unit: WeightUnit,
): number | null {
  if (lb == null || !Number.isFinite(lb)) return null
  if (unit === 'lb') return Math.round(lb * 10) / 10
  return Math.round((lb / LB_PER_KG) * 10) / 10
}

/** valor UI → lb (DB) */
export function displayToLb(
  value: number | null | undefined,
  unit: WeightUnit,
): number | null {
  if (value == null || !Number.isFinite(value)) return null
  if (unit === 'lb') return Math.round(value * 10) / 10
  return Math.round(value * LB_PER_KG * 10) / 10
}

export function formatWeight(
  lb: number | null | undefined,
  unit: WeightUnit = getStoredWeightUnit(),
): string {
  const v = lbToDisplay(lb, unit)
  if (v == null) return '—'
  const label = weightUnitLabel(unit)
  return unit === 'kg' ? `${v} ${label}` : `${Math.round(v)} ${label}`
}

export function formatWeightPair(
  weightLb: number | null | undefined,
  reps: number | null | undefined,
  unit: WeightUnit = getStoredWeightUnit(),
): string {
  const w = formatWeight(weightLb, unit)
  const r = reps == null ? '—' : String(reps)
  return `${w} × ${r}`
}

/** @deprecated */
export const WEIGHT_UNIT = 'lb'
/** @deprecated */
export const WEIGHT_STEP = 5
