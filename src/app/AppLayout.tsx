import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { isBackupReminderDue } from '../db/backup'
import { MoreMenuSheet } from './MoreMenuSheet'

const tabs = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/rutinas', label: 'Rutinas' },
  { to: '/historial', label: 'Historial' },
] as const

const tabClass = (active: boolean) =>
  [
    'flex min-h-11 items-center justify-center rounded-xl px-1 text-sm font-semibold transition',
    active
      ? 'bg-chrome text-chrome-fg'
      : 'text-muted hover:bg-brand-soft hover:text-fg',
  ].join(' ')

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
      <header className="top-nav-shell app-safe-top z-40 shrink-0 border-b border-line bg-surface-elevated">
        <nav className="px-2 pb-2 pt-1" aria-label="Navegación principal">
          <ul className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={'end' in tab ? tab.end : false}
                  className={({ isActive }) => tabClass(isActive)}
                >
                  {tab.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={['relative w-full', tabClass(moreActive)].join(' ')}
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
      </header>

      <main className="app-safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <Outlet />
      </main>

      <MoreMenuSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        showBackupBadge={showBackupBadge}
      />
    </div>
  )
}
