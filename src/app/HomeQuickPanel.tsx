import { useEffect } from 'react'
import { HistoryList } from '../features/history/HistoryList'
import { PrPanel } from '../features/routines/PrPanel'
import { useHorizontalDismiss } from '../hooks/useEdgeSwipe'
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets'

export type HomeQuickPanelType = 'history' | 'prs' | null

interface HomeQuickPanelProps {
  panel: HomeQuickPanelType
  onClose: () => void
}

export function HomeQuickPanel({ panel, onClose }: HomeQuickPanelProps) {
  const { top, bottom, standalone } = useSafeAreaInsets()
  const paddingTop = Math.max(top + (standalone ? 24 : 16), standalone ? 64 : 48)
  const paddingBottom = Math.max(bottom + 16, 24)

  useEffect(() => {
    if (!panel) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, onClose])

  useHorizontalDismiss({
    enabled: panel === 'history',
    dismissOnSwipeLeft: true,
    onDismiss: onClose,
  })

  useHorizontalDismiss({
    enabled: panel === 'prs',
    dismissOnSwipeRight: true,
    onDismiss: onClose,
  })

  if (!panel) return null

  return (
    <div className="home-quick-panel-root" role="presentation">
      <aside
        className={[
          'home-quick-panel',
          panel === 'history' ? 'home-quick-panel--history' : 'home-quick-panel--prs',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={panel === 'history' ? 'Historial' : 'Tus PR'}
        style={{ paddingTop, paddingBottom }}
      >
        <div className="mx-auto flex h-full w-full max-w-lg flex-col px-4">
          {panel === 'history' ? (
            <>
              <div className="relative mb-5 shrink-0 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg"
                >
                  Cerrar
                </button>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  Mi Gym
                </p>
                <h2 className="font-display text-2xl font-extrabold text-fg">Historial</h2>
                <p className="mt-1 text-sm text-muted">
                  Entrenamientos guardados · desliza ← para volver
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
                <HistoryList onNavigate={onClose} />
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col pb-2">
              <PrPanel active onClose={onClose} showCloseButton />
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
