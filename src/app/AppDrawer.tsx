import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PrPanel } from '../features/routines/PrPanel'
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets'

type DrawerView = 'menu' | 'prs'

interface AppDrawerProps {
  open: boolean
  onClose: () => void
  showBackupBadge?: boolean
}

function DrawerNavItem({
  to,
  end,
  icon,
  label,
  subtitle,
  onNavigate,
}: {
  to: string
  end?: boolean
  icon: string
  label: string
  subtitle?: string
  onNavigate: () => void
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            'flex items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 transition active:scale-[0.99]',
            isActive
              ? 'bg-chrome text-chrome-fg ring-chrome'
              : 'bg-surface text-fg ring-line hover:bg-brand-soft',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg">
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{label}</span>
              {subtitle ? (
                <span
                  className={[
                    'block text-sm',
                    isActive ? 'text-chrome-fg/80' : 'text-muted',
                  ].join(' ')}
                >
                  {subtitle}
                </span>
              ) : null}
            </span>
          </>
        )}
      </NavLink>
    </li>
  )
}

function DrawerActionItem({
  icon,
  label,
  subtitle,
  badge,
  onClick,
}: {
  icon: string
  label: string
  subtitle?: string
  badge?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface px-3 py-3 text-left ring-1 ring-line transition active:scale-[0.99] hover:bg-brand-soft"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg">
          {icon}
          {badge ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface-elevated" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-semibold text-fg">{label}</span>
          {subtitle ? (
            <span className="block text-sm text-muted">{subtitle}</span>
          ) : null}
        </span>
      </button>
    </li>
  )
}

export function AppDrawer({
  open,
  onClose,
  showBackupBadge = false,
}: AppDrawerProps) {
  const navigate = useNavigate()
  const [view, setView] = useState<DrawerView>('menu')
  const { top, bottom, standalone } = useSafeAreaInsets()
  const panelPaddingTop = Math.max(top + (standalone ? 24 : 16), standalone ? 64 : 48)
  const panelPaddingBottom = Math.max(bottom + 16, 24)

  useEffect(() => {
    if (!open) setView('menu')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
    <div className="app-drawer-root" role="presentation">
      <aside
        className="app-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        style={{
          paddingTop: panelPaddingTop,
          paddingBottom: panelPaddingBottom,
        }}
      >
        {view === 'menu' ? (
          <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-center px-5">
            <div className="relative mb-8 text-center">
              <button
                type="button"
                onClick={closeAll}
                className="absolute right-0 top-0 rounded-xl bg-brand-soft px-3 py-2 text-sm font-bold text-fg"
              >
                Cerrar
              </button>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Mi Gym
              </p>
              <h2 className="font-display text-2xl font-extrabold text-fg">Menú</h2>
            </div>

            <nav className="min-h-0 overflow-y-auto">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                Principal
              </p>
              <ul className="space-y-2">
                <DrawerNavItem
                  to="/"
                  end
                  icon="🏠"
                  label="Inicio"
                  subtitle="Hoy y entrenamiento"
                  onNavigate={closeAll}
                />
                <DrawerNavItem
                  to="/rutinas"
                  icon="📋"
                  label="Rutinas"
                  subtitle="Editar tu plan"
                  onNavigate={closeAll}
                />
                <DrawerNavItem
                  to="/historial"
                  icon="🕐"
                  label="Historial"
                  subtitle="Sesiones anteriores"
                  onNavigate={closeAll}
                />
              </ul>

              <p className="mb-2 mt-6 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                Más
              </p>
              <ul className="space-y-2">
                <DrawerActionItem
                  icon="🏃"
                  label="Caminadora"
                  subtitle="Cardio aparte de constancia"
                  onClick={() => go('/caminadora')}
                />
                <DrawerActionItem
                  icon="🏆"
                  label="Tus PR"
                  subtitle="Marcas personales"
                  onClick={() => setView('prs')}
                />
                <DrawerActionItem
                  icon="⚙️"
                  label="Temas y respaldo"
                  subtitle="Apariencia y exportar datos"
                  badge={showBackupBadge}
                  onClick={() => go('/progreso')}
                />
              </ul>
            </nav>
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-center px-5">
            <button
              type="button"
              onClick={() => setView('menu')}
              className="mb-4 self-center text-sm font-semibold text-brand"
            >
              ← Volver al menú
            </button>
            <PrPanel active={view === 'prs'} onClose={closeAll} showCloseButton={false} />
          </div>
        )}
      </aside>
    </div>
  )
}
