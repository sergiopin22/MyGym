import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { isBackupReminderDue } from '../db/backup'
import { MoreMenuSheet } from './MoreMenuSheet'

const tabs = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/rutinas', label: 'Rutinas' },
  { to: '/historial', label: 'Historial' },
] as const

export function AppLayout() {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const showBackupBadge = isBackupReminderDue()
  const moreActive =
    moreOpen ||
    location.pathname === '/progreso' ||
    location.pathname === '/caminadora'

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden">
      <main className="app-safe-top min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <Outlet />
      </main>

      <nav
        className="z-40 shrink-0 border-t border-line bg-surface-elevated"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegación principal"
      >
        <ul className="grid grid-cols-4 gap-1 px-2 pt-2">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={'end' in tab ? tab.end : false}
                className={({ isActive }) =>
                  [
                    'flex min-h-12 items-center justify-center rounded-xl px-1 text-sm font-semibold transition',
                    isActive
                      ? 'bg-chrome text-chrome-fg'
                      : 'text-muted hover:bg-brand-soft hover:text-fg',
                  ].join(' ')
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={[
                'relative flex min-h-12 w-full items-center justify-center rounded-xl px-1 text-sm font-semibold transition',
                moreActive
                  ? 'bg-chrome text-chrome-fg'
                  : 'text-muted hover:bg-brand-soft hover:text-fg',
              ].join(' ')}
              aria-label="Más opciones"
              aria-expanded={moreOpen}
            >
              Más
              {showBackupBadge ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
              ) : null}
            </button>
          </li>
        </ul>
      </nav>

      <MoreMenuSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        showBackupBadge={showBackupBadge}
      />
    </div>
  )
}
