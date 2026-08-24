import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldClass =
  'w-full min-h-12 rounded-2xl border border-line bg-surface-elevated px-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/25'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function TextField({ label, hint, id, className = '', ...rest }: TextFieldProps) {
  const inputId = id ?? rest.name
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input id={inputId} className={`${fieldClass} ${className}`} {...rest} />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextArea({ label, id, className = '', ...rest }: TextAreaProps) {
  const inputId = id ?? rest.name
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        id={inputId}
        className={`${fieldClass} min-h-24 py-3 ${className}`}
        {...rest}
      />
    </label>
  )
}
