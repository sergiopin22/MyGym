import type { InputHTMLAttributes } from 'react'

interface NumberStepperProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  step?: number
  suffix?: string
  allowEmpty?: boolean
}

export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  suffix,
  min,
  max,
  allowEmpty = true,
  ...rest
}: NumberStepperProps) {
  const numeric = value ?? 0

  function bump(delta: number) {
    const next = Math.round((numeric + delta) * 100) / 100
    const lo = min != null ? Number(min) : undefined
    const hi = max != null ? Number(max) : undefined
    let clamped = next
    if (lo != null && clamped < lo) clamped = lo
    if (hi != null && clamped > hi) clamped = hi
    onChange(clamped)
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        {suffix ? ` (${suffix})` : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-ink active:scale-95"
          onClick={() => bump(-step)}
          aria-label={`Bajar ${label}`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          className="h-12 w-full rounded-2xl border border-line bg-surface-elevated text-center text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={value ?? ''}
          placeholder="—"
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '' && allowEmpty) {
              onChange(null)
              return
            }
            const n = Number(raw)
            onChange(Number.isFinite(n) ? n : null)
          }}
          {...rest}
        />
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-ink active:scale-95"
          onClick={() => bump(step)}
          aria-label={`Subir ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
