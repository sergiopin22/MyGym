import { useMemo, useState } from 'react'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import type { WeightUnit } from '../../utils/weight'

const PLATES_LB = [45, 35, 25, 10, 5, 2.5] as const
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const

function platesFor(unit: WeightUnit): readonly number[] {
  return unit === 'kg' ? PLATES_KG : PLATES_LB
}

function formatPlate(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n)
}

function summarize(plates: number[]): string {
  if (plates.length === 0) return 'Sin discos'
  const counts = new Map<number, number>()
  for (const p of plates) {
    counts.set(p, (counts.get(p) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([w, c]) => `${c}×${formatPlate(w)}`)
    .join(' + ')
}

export function PlateCalcIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}

interface PlateCalculatorProps {
  /** Si hay onClose, muestra botón Salir (p. ej. desde el entreno). */
  onClose?: () => void
  compact?: boolean
}

/** Suma solo discos (sin barra). */
export function PlateCalculator({ onClose, compact = false }: PlateCalculatorProps) {
  const { unit, label } = useWeightUnit()
  const options = useMemo(() => platesFor(unit), [unit])
  const [plates, setPlates] = useState<number[]>([])

  const total = useMemo(
    () => plates.reduce((sum, p) => sum + p, 0),
    [plates],
  )

  function addPlate(weight: number) {
    setPlates((prev) => [...prev, weight])
  }

  function undoLast() {
    setPlates((prev) => prev.slice(0, -1))
  }

  function clearAll() {
    setPlates([])
  }

  return (
    <div
      className={[
        'plate-calc mx-auto w-full max-w-lg space-y-5',
        compact ? 'plate-calc--compact' : '',
      ].join(' ')}
    >
      <header>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Herramienta
        </p>
        <h1
          className={[
            'mt-1 font-display font-extrabold text-fg',
            compact ? 'text-2xl' : 'text-3xl',
          ].join(' ')}
        >
          Calculadora de discos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Toca los discos que vas a poner. Solo suma piezas — sin barra.
        </p>
      </header>

      <section className="plate-calc__total" aria-live="polite">
        <p className="plate-calc__total-label">Total</p>
        <p className="plate-calc__total-value">
          {Number.isInteger(total) ? total : Math.round(total * 10) / 10}
          <span>{label}</span>
        </p>
        <p className="plate-calc__breakdown">{summarize(plates)}</p>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Agregar disco ({label})
        </p>
        <div className="plate-calc__grid">
          {options.map((w) => (
            <button
              key={w}
              type="button"
              className="plate-calc__plate"
              onClick={() => addPlate(w)}
            >
              <span className="plate-calc__plate-w">{formatPlate(w)}</span>
              <span className="plate-calc__plate-u">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="plate-calc__action"
          disabled={plates.length === 0}
          onClick={undoLast}
        >
          Quitar último
        </button>
        <button
          type="button"
          className="plate-calc__action plate-calc__action--ghost"
          disabled={plates.length === 0}
          onClick={clearAll}
        >
          Limpiar
        </button>
      </div>

      {plates.length > 0 ? (
        <section className="plate-calc__stack" aria-label="Discos agregados">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Orden ({plates.length})
          </p>
          <ol className="plate-calc__chips">
            {plates.map((w, i) => (
              <li key={`${w}-${i}`} className="plate-calc__chip">
                {formatPlate(w)}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {onClose ? (
        <button
          type="button"
          className="plate-calc__exit"
          onClick={onClose}
        >
          Salir
        </button>
      ) : null}
    </div>
  )
}
