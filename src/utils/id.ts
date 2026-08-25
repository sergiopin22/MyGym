/** Genera un id único lo bastante bueno para uso local offline */
export function createId(prefix = ''): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}_${id}` : id
}

export function todayISODate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Lunes de la semana (ISO-ish: semana empieza lunes) */
export function startOfWeekMonday(d = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return todayISODate(date)
}

export function isoWeekKey(d = new Date()): string {
  const monday = startOfWeekMonday(d)
  const year = monday.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.floor(
    (monday.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekdayFromISO(iso: string): number {
  return parseISODate(iso).getDay()
}

export function weekdayLabel(weekday: number): string {
  const labels = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ]
  return labels[weekday] ?? 'Día'
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function isWeekend(weekday: number = new Date().getDay()): boolean {
  return weekday === 0 || weekday === 6
}
