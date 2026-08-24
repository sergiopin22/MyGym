import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/rutinas', label: 'Rutinas' },
  { to: '/historial', label: 'Historial' },
  { to: '/progreso', label: 'Progreso' },
] as const

export function AppLayout() {
  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
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
        </ul>
      </nav>
    </div>
  )
}
