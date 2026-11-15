import {
  addDaysISO,
  isoWeekKey,
  parseISODate,
  startOfWeekMonday,
  todayISODate,
  weekdayFromISO,
} from './id'

const DISMISS_KEY = 'mi-gym-weekly-banner-dismissed'

/** Lunes de la semana que se resume el aviso (la semana que acaba de terminar). */
export function getWeeklyBannerWeekStart(today = todayISODate()): string | null {
  /* Solo lunes: avisar de la semana que acaba de cerrar */
  if (weekdayFromISO(today) !== 1) return null
  const thisMonday = todayISODate(startOfWeekMonday(parseISODate(today)))
  return addDaysISO(thisMonday, -7)
}

export function isWeeklyBannerDismissed(weekStart: string): boolean {
  try {
    return localStorage.getItem(`${DISMISS_KEY}:${weekStart}`) === '1'
  } catch {
    return false
  }
}

export function dismissWeeklyBanner(weekStart: string): void {
  try {
    localStorage.setItem(`${DISMISS_KEY}:${weekStart}`, '1')
  } catch {
    /* private mode */
  }
}

export function weeklyBannerWeekKey(weekStart: string): string {
  return isoWeekKey(parseISODate(weekStart))
}
