import type { InputHTMLAttributes } from 'react'
import { useEffect, useState } from 'react'

interface NumberStepperProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  step?: number
  suffix?: string
  allowEmpty?: boolean
}

function clamp(n: number, min?: number, max?: number) {
  let v = n
  if (min != null && v < min) v = min
  if (max != null && v > max) v = max
  return v
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
  const lo = min != null ? Number(min) : undefined
  const hi = max != null ? Number(max) : undefined
  const numeric = value ?? lo ?? 0

  /** Borrador local para poder escribir libremente (ej. borrar y poner 8) */
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDraft(value == null ? '' : String(value))
    }
  }, [value, focused])

  function bump(delta: number) {
    const next = clamp(
      Math.round((numeric + delta) * 100) / 100,
      lo,
      hi,
    )
    onChange(next)
    setDraft(String(next))
  }

  function commitDraft(raw: string) {
    if (raw.trim() === '') {
      if (allowEmpty) {
        onChange(null)
        setDraft('')
        return
      }
      const fallback = lo ?? 1
      onChange(fallback)
      setDraft(String(fallback))
      return
    }
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      setDraft(value == null ? '' : String(value))
      return
    }
    const clamped = clamp(n, lo, hi)
    onChange(clamped)
    setDraft(String(clamped))
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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-fg active:scale-95"
          onClick={() => bump(-step)}
          aria-label={`Bajar ${label}`}
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-12 w-full rounded-2xl border border-line bg-surface text-center text-lg font-semibold text-fg caret-fg outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/25"
          value={focused ? draft : value == null ? '' : String(value)}
          placeholder="—"
          onFocus={() => {
            setFocused(true)
            setDraft(value == null ? '' : String(value))
          }}
          onBlur={() => {
            setFocused(false)
            commitDraft(draft)
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, '')
            setDraft(raw)
            if (raw === '') {
              if (allowEmpty) onChange(null)
              return
            }
            const n = Number(raw)
            if (!Number.isFinite(n)) return
            // Mientras escribe no forzamos al mínimo (permite borrar y poner 8)
            if (hi != null && n > hi) {
              onChange(hi)
              setDraft(String(hi))
              return
            }
            onChange(n)
          }}
          {...rest}
        />
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-fg active:scale-95"
          onClick={() => bump(step)}
          aria-label={`Subir ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
