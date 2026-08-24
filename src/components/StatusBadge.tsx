import type { ExerciseStatus } from '../types'

const config: Record<
  ExerciseStatus,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: 'Pendiente',
    icon: '⏳',
    className: 'bg-brand-soft text-muted',
  },
  in_progress: {
    label: 'En progreso',
    icon: '🟡',
    className: 'bg-progress-soft text-progress',
  },
  completed: {
    label: 'Completado',
    icon: '✅',
    className: 'bg-success-soft text-accent-strong',
  },
}

export function StatusBadge({ status }: { status: ExerciseStatus }) {
  const c = config[status]
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        c.className,
      ].join(' ')}
    >
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  )
}
