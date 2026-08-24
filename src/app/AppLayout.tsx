import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/rutinas', label: 'Rutinas' },
  { to: '/historial', label: 'Historial' },
  { to: '/progreso', label: 'Progreso' },
] as const

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-elevated/95 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegación principal"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2">
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
