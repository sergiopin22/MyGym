import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrPanel } from '../features/routines/PrPanel'

type MoreView = 'menu' | 'prs'

interface MoreMenuSheetProps {
  open: boolean
  onClose: () => void
  showBackupBadge?: boolean
}

export function MoreMenuSheet({
  open,
  onClose,
  showBackupBadge = false,
}: MoreMenuSheetProps) {
  const navigate = useNavigate()
  const [view, setView] = useState<MoreView>('menu')

  useEffect(() => {
    if (!open) setView('menu')
  }, [open])

  if (!open) return null

  function closeAll() {
    setView('menu')
    onClose()
  }

  function go(path: string) {
    closeAll()
    navigate(path)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Más opciones"
      onClick={closeAll}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface-elevated p-4 shadow-xl sm:rounded-3xl"
        style={{ paddingBottom: 'max(1rem, var(--sab, env(safe-area-inset-bottom)))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'menu' ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-extrabold text-fg">Más</h2>
                <p className="text-sm text-muted">
                  Cardio, PRs, temas y respaldo
                </p>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg"
              >
                Cerrar
              </button>
            </div>

            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-line transition active:scale-[0.99] hover:bg-brand-soft"
                  onClick={() => go('/caminadora')}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-lg">
                    🏃
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">Caminadora</span>
                    <span className="block text-sm text-muted">
                      Velocidad, inclinación, tiempo y calorías
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-line transition active:scale-[0.99] hover:bg-brand-soft"
                  onClick={() => setView('prs')}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-lg">
                    🏆
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">Tus PR</span>
                    <span className="block text-sm text-muted">
                      Marcas personales de tu rutina
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-line transition active:scale-[0.99] hover:bg-brand-soft"
                  onClick={() => go('/progreso')}
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-lg">
                    ⚙️
                    {showBackupBadge ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface-elevated" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">
                      Temas y respaldo
                    </span>
                    <span className="block text-sm text-muted">
                      Apariencia, exportar e importar datos
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView('menu')}
              className="mb-3 self-start text-sm font-semibold text-brand"
            >
              ← Volver
            </button>
            <PrPanel active={view === 'prs'} onClose={closeAll} />
          </>
        )}
      </div>
    </div>
  )
}
