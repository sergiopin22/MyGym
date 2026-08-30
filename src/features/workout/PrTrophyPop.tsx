import type { SessionNewPR } from '../../db/repository'
import { formatStrapsLabel } from '../../utils/straps'

interface PrTrophyPopProps {
  prs: SessionNewPR[]
  onClose: () => void
}

export function PrTrophyPop({ prs, onClose }: PrTrophyPopProps) {
  if (prs.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-overlay px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevos récords personales"
      onClick={onClose}
    >
      <div
        className="pr-pop flex max-h-[min(88dvh,640px)] w-full max-w-sm flex-col rounded-3xl bg-surface-elevated p-5 text-center shadow-xl ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0">
          <div
            className="pr-pop-trophy mx-auto mb-3 flex h-16 w-16 items-center justify-center text-5xl"
            aria-hidden
          >
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
        </div>

        <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-left">
          {prs.map((pr) => (
            <li
              key={`${pr.exerciseName}-${pr.withStraps ? 'straps' : 'free'}`}
              className="rounded-2xl bg-surface px-3 py-3 ring-1 ring-line"
            >
              <p className="text-sm font-semibold text-fg">
                {pr.exerciseName}
                {pr.withStraps ? (
                  <span className="ml-1 text-xs font-bold uppercase text-brand">
                    · {formatStrapsLabel(true)}
                  </span>
                ) : null}
              </p>
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
        </ul>

        <button
          type="button"
          className="mt-5 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-accent-fg transition active:scale-[0.98]"
          onClick={onClose}
        >
          Genial
        </button>
      </div>
    </div>
  )
}
