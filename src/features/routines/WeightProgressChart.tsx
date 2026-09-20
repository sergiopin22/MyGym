import { useId, useMemo, useState } from 'react'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import type { ExerciseProgressPoint } from '../../db/repository'
import {
  formatWeight,
  lbToDisplay,
  weightUnitLabel,
  type WeightUnit,
} from '../../utils/weight'

interface WeightProgressChartProps {
  points: ExerciseProgressPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  unitOverride?: WeightUnit
}

function shortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function rangeLabel(points: ExerciseProgressPoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return shortDate(points[0].date)
  return `${shortDate(points[0].date)} – ${shortDate(points[points.length - 1].date)}`
}

/** Curva suave tipo Hevy (Catmull-Rom → bezier) */
function smoothPath(
  coords: Array<{ x: number; y: number }>,
  closeToFloor?: number,
): string {
  if (coords.length === 0) return ''
  if (coords.length === 1) {
    const c = coords[0]
    if (closeToFloor == null) return `M ${c.x} ${c.y}`
    return `M ${c.x} ${closeToFloor} L ${c.x} ${c.y}`
  }

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  if (closeToFloor != null) {
    const last = coords[coords.length - 1]
    const first = coords[0]
    d += ` L ${last.x.toFixed(1)} ${closeToFloor} L ${first.x.toFixed(1)} ${closeToFloor} Z`
  }
  return d
}

/** Área sólida bajo curva suave (estilo Hevy) */
export function WeightProgressChart({
  points,
  selectedIndex,
  onSelect,
  unitOverride,
}: WeightProgressChartProps) {
  const ctx = useWeightUnit()
  const unit = unitOverride ?? ctx.unit
  const toDisplay = (lb: number | null | undefined) => lbToDisplay(lb, unit)
  const label = weightUnitLabel(unit)
  const format = (lb: number | null | undefined) => formatWeight(lb, unit)
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')

  const layout = useMemo(() => {
    const W = 520
    const H = 176
    // Margen lateral para que puntos y tooltips no se corten
    const pad = { top: 28, right: 28, bottom: 14, left: 28 }
    const innerW = W - pad.left - pad.right
    const innerH = H - pad.top - pad.bottom
    const floorY = pad.top + innerH

    const weights = points.map((p) => toDisplay(p.weight) ?? 0)
    const minW = Math.min(...weights)
    const maxW = Math.max(...weights)
    const span = Math.max(maxW - minW, maxW * 0.08, 4)
    const yMax = maxW + span * 0.18
    const yMin = Math.max(0, minW - span * 0.4)

    const xAt = (i: number) => {
      if (points.length === 1) return pad.left + innerW * 0.72
      return pad.left + (i / (points.length - 1)) * innerW
    }
    const yAt = (w: number) =>
      pad.top + innerH - ((w - yMin) / (yMax - yMin || 1)) * innerH

    let coords = weights.map((w, i) => ({ x: xAt(i), y: yAt(w), w }))

    // 1 punto: tramo corto ascendente para que se vea el área (como Hevy)
    if (coords.length === 1) {
      const end = coords[0]
      const start = {
        x: pad.left + innerW * 0.12,
        y: Math.min(floorY - 6, end.y + innerH * 0.5),
        w: end.w,
      }
      coords = [start, end]
    }

    const linePath = smoothPath(coords)
    const areaPath = smoothPath(coords, floorY)

    // Dots solo en sesiones reales
    const dots =
      points.length === 1
        ? [{ x: coords[coords.length - 1].x, y: coords[coords.length - 1].y, i: 0 }]
        : coords.map((c, i) => ({ x: c.x, y: c.y, i }))

    return {
      W,
      H,
      pad,
      floorY,
      linePath,
      areaPath,
      dots,
      range: rangeLabel(points),
    }
  }, [points, toDisplay])

  if (points.length === 0) return null

  const active = hover ?? selectedIndex
  const activePoint =
    active != null && active >= 0 && active < points.length
      ? points[active]
      : null
  const activeDot = layout.dots.find((d) => d.i === active) ?? null
  const fillId = `hevyFill-${gid}`

  const tipEdge =
    active == null || points.length <= 1
      ? 'mid'
      : active === 0
        ? 'start'
        : active === points.length - 1
          ? 'end'
          : 'mid'

  return (
    <div className="pr-stats-chart pr-stats-chart--hevy">
      <div className="pr-stats-chart__head">
        <div>
          <p className="pr-stats-chart__hero">
            {activePoint
              ? format(activePoint.weight)
              : format(points[points.length - 1]?.weight)}
          </p>
          <p className="pr-stats-chart__range">{layout.range}</p>
        </div>
        <p className="pr-stats-chart__metric">Peso ({label})</p>
      </div>

      <div className="pr-stats-chart__canvas">
        <svg
          viewBox={`0 0 ${layout.W} ${layout.H}`}
          className="pr-stats-chart__svg"
          role="img"
          aria-label="Progreso de peso en el tiempo"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.88" />
            </linearGradient>
          </defs>

          <path d={layout.areaPath} fill={`url(#${fillId})`} className="pr-stats-chart__area" />
          <path d={layout.linePath} className="pr-stats-chart__line" fill="none" />

          {layout.dots.map((d) => {
            const on = active === d.i
            return (
              <g key={points[d.i].sessionId + d.i}>
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={18}
                  fill="transparent"
                  className="pr-stats-chart__hit"
                  onPointerEnter={() => setHover(d.i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => onSelect(d.i)}
                />
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={on ? 5.5 : 4}
                  className={[
                    'pr-stats-chart__dot',
                    on ? 'pr-stats-chart__dot--on' : '',
                  ].join(' ')}
                  pointerEvents="none"
                />
              </g>
            )
          })}
        </svg>

        {activePoint && activeDot ? (
          <div
            className={[
              'pr-stats-chart__tip',
              `pr-stats-chart__tip--${tipEdge}`,
            ].join(' ')}
            style={{
              left: `${(activeDot.x / layout.W) * 100}%`,
              top: `${(activeDot.y / layout.H) * 100}%`,
            }}
          >
            <strong>{format(activePoint.weight)}</strong>
            <span>{shortDate(activePoint.date)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
