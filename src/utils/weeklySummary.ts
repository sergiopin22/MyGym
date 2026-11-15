import type { WeightUnit } from './weight'
import { formatWeightPair } from './weight'
import { formatShortDateEs } from './id'

export type WeeklyMachineStatus = 'up' | 'same' | 'down' | 'new' | 'no_data'

export interface WeeklyBestSet {
  weight: number
  reps: number
}

export interface WeeklyMachineRow {
  key: string
  name: string
  status: WeeklyMachineStatus
  current: WeeklyBestSet | null
  previous: WeeklyBestSet | null
}

export interface WeeklyMachineSummary {
  weekStart: string
  weekEnd: string
  prevWeekStart: string
  prevWeekEnd: string
  counts: {
    up: number
    same: number
    down: number
    new: number
    noData: number
  }
  champion: WeeklyMachineRow | null
  rows: WeeklyMachineRow[]
}

export function compareBestSets(
  current: WeeklyBestSet | null,
  previous: WeeklyBestSet | null,
): WeeklyMachineStatus {
  if (!current && !previous) return 'no_data'
  if (current && !previous) return 'new'
  if (!current && previous) return 'no_data'
  if (!current || !previous) return 'no_data'

  if (current.weight > previous.weight) return 'up'
  if (current.weight < previous.weight) return 'down'
  if (current.reps > previous.reps) return 'up'
  if (current.reps < previous.reps) return 'down'
  return 'same'
}

function setRank(set: WeeklyBestSet): number {
  return set.weight * 10_000 + set.reps
}

/** Mejora relativa para elegir campeón (sin 1RM). */
export function improvementScore(row: WeeklyMachineRow): number {
  if (!row.current) return -1
  if (row.status === 'new') return setRank(row.current) * 0.01
  if (row.status !== 'up' || !row.previous) return -1
  return setRank(row.current) - setRank(row.previous)
}

export function buildWeeklyMachineSummary(input: {
  weekStart: string
  weekEnd: string
  prevWeekStart: string
  prevWeekEnd: string
  /** Mejor serie por clave de máquina en la semana actual */
  currentByKey: Map<string, { name: string; best: WeeklyBestSet }>
  previousByKey: Map<string, { name: string; best: WeeklyBestSet }>
  /** Máquinas de la rutina (y extras) a mostrar siempre */
  catalog: Array<{ key: string; name: string }>
}): WeeklyMachineSummary {
  const seen = new Set<string>()
  const rows: WeeklyMachineRow[] = []

  for (const item of input.catalog) {
    if (seen.has(item.key)) continue
    seen.add(item.key)
    const cur = input.currentByKey.get(item.key)
    const prev = input.previousByKey.get(item.key)
    const current = cur?.best ?? null
    const previous = prev?.best ?? null
    const name = cur?.name ?? prev?.name ?? item.name
    rows.push({
      key: item.key,
      name,
      status: compareBestSets(current, previous),
      current,
      previous,
    })
  }

  for (const [key, cur] of input.currentByKey) {
    if (seen.has(key)) continue
    seen.add(key)
    const prev = input.previousByKey.get(key)
    rows.push({
      key,
      name: cur.name,
      status: compareBestSets(cur.best, prev?.best ?? null),
      current: cur.best,
      previous: prev?.best ?? null,
    })
  }

  for (const [key, prev] of input.previousByKey) {
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      key,
      name: prev.name,
      status: compareBestSets(null, prev.best),
      current: null,
      previous: prev.best,
    })
  }

  const statusOrder: Record<WeeklyMachineStatus, number> = {
    up: 0,
    new: 1,
    same: 2,
    down: 3,
    no_data: 4,
  }

  rows.sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status]
    if (byStatus !== 0) return byStatus
    return a.name.localeCompare(b.name, 'es')
  })

  const counts = {
    up: rows.filter((r) => r.status === 'up').length,
    same: rows.filter((r) => r.status === 'same').length,
    down: rows.filter((r) => r.status === 'down').length,
    new: rows.filter((r) => r.status === 'new').length,
    noData: rows.filter((r) => r.status === 'no_data').length,
  }

  let champion: WeeklyMachineRow | null = null
  let bestScore = -1
  for (const row of rows) {
    if (row.status !== 'up' && row.status !== 'new') continue
    const score = improvementScore(row)
    if (score > bestScore) {
      bestScore = score
      champion = row
    }
  }

  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    prevWeekStart: input.prevWeekStart,
    prevWeekEnd: input.prevWeekEnd,
    counts,
    champion,
    rows,
  }
}

export function formatSetShort(
  set: WeeklyBestSet | null,
  unit: WeightUnit,
): string {
  if (!set) return '—'
  return formatWeightPair(set.weight, set.reps, unit)
}

export function statusLabelEs(status: WeeklyMachineStatus): string {
  switch (status) {
    case 'up':
      return 'Subió'
    case 'same':
      return 'Se mantuvo'
    case 'down':
      return 'Bajó'
    case 'new':
      return 'Nuevo'
    case 'no_data':
      return 'Sin dato'
  }
}

export function formatWeeklySummaryForCoach(
  summary: WeeklyMachineSummary,
  unit: WeightUnit,
): string {
  const range = `${formatShortDateEs(summary.weekStart)} – ${formatShortDateEs(summary.weekEnd)}`
  const vs = `${formatShortDateEs(summary.prevWeekStart)} – ${formatShortDateEs(summary.prevWeekEnd)}`
  const lines: string[] = [
    `Resumen semanal MyGym (${range})`,
    `vs semana anterior (${vs})`,
    '',
    `Subieron ${summary.counts.up} · Se mantuvieron ${summary.counts.same} · Bajaron ${summary.counts.down} · Nuevos ${summary.counts.new} · Sin dato ${summary.counts.noData}`,
  ]

  if (summary.champion) {
    const c = summary.champion
    lines.push(
      '',
      `Campeón: ${c.name}`,
      `${formatSetShort(c.previous, unit)} → ${formatSetShort(c.current, unit)}`,
    )
  }

  lines.push('', 'Todas las máquinas:')
  for (const row of summary.rows) {
    const mark =
      row.status === 'up'
        ? '↑'
        : row.status === 'down'
          ? '↓'
          : row.status === 'same'
            ? '='
            : row.status === 'new'
              ? '★'
              : '·'
    if (row.status === 'no_data' && !row.current && !row.previous) {
      lines.push(`${mark} ${row.name}: sin dato`)
      continue
    }
    if (row.status === 'new') {
      lines.push(
        `${mark} ${row.name}: ${formatSetShort(row.current, unit)} (sin semana previa)`,
      )
      continue
    }
    if (row.status === 'no_data' && row.previous && !row.current) {
      lines.push(
        `${mark} ${row.name}: no se hizo (antes ${formatSetShort(row.previous, unit)})`,
      )
      continue
    }
    lines.push(
      `${mark} ${row.name}: ${formatSetShort(row.previous, unit)} → ${formatSetShort(row.current, unit)}`,
    )
  }

  return lines.join('\n')
}
