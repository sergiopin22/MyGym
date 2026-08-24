interface ProgressBarProps {
  value: number
  max?: number
  label?: string
}

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{label}</span>
          <span className="font-semibold text-ink">{percent}%</span>
        </div>
      ) : null}
      <div
        className="h-3 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
