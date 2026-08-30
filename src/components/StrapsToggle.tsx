interface StrapsToggleProps {
  active: boolean
  disabled?: boolean
  onToggle: () => void
}

export function StrapsToggle({ active, disabled, onToggle }: StrapsToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={active}
      className={[
        'min-h-10 rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50',
        active
          ? 'bg-chrome text-chrome-fg ring-2 ring-brand/40'
          : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
      ].join(' ')}
    >
      {active ? 'Con straps' : 'Sin straps'}
    </button>
  )
}
