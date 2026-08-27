import type { SessionNewPR } from '../../db/repository'

interface PrTrophyPopProps {
  prs: SessionNewPR[]
  onClose: () => void
}

export function PrTrophyPop({ prs, onClose }: PrTrophyPopProps) {
  if (prs.length === 0) return null

  const shown = prs.slice(0, 3)
  const extra = prs.length - shown.length

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevos récords personales"
      onClick={onClose}
    >
      <div
        className="pr-pop w-full max-w-sm rounded-3xl bg-surface-elevated p-5 text-center shadow-xl ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pr-pop-trophy mx-auto mb-3 flex h-16 w-16 items-center justify-center text-5xl" aria-hidden>
          <span className="pr-pop-glow">🏆</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-fg">
          ¡Nuevo PR!
        </h2>
        <p className="mt-1 text-sm text-muted">
          {prs.length === 1
            ? 'Rompiste tu marca en este ejercicio'
            : `Rompiste tu marca en ${prs.length} ejercicios`}
        </p>

        <ul className="mt-4 space-y-2 text-left">
          {shown.map((pr) => (
            <li
              key={pr.exerciseName}
              className="rounded-2xl bg-surface px-3 py-3 ring-1 ring-line"
            >
              <p className="text-sm font-semibold text-fg">{pr.exerciseName}</p>
              <p className="mt-1 text-sm font-bold text-fg">
                {pr.weight} lb × {pr.reps}
                {pr.rir != null ? ` · RIR ${pr.rir}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {pr.previous
                  ? `Antes: ${pr.previous.weight} lb × ${pr.previous.reps}`
                  : 'Primera marca registrada'}
              </p>
            </li>
          ))}
          {extra > 0 ? (
            <li className="text-center text-xs font-semibold text-muted">
              +{extra} más
            </li>
          ) : null}
        </ul>

        <button
          type="button"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-accent-fg transition active:scale-[0.98]"
          onClick={onClose}
        >
          Genial
        </button>
      </div>
    </div>
  )
}
