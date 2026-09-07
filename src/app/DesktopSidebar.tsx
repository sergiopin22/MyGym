import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeProvider'

const LINKS: Array<{
  to: string
  end?: boolean
  label: string
  hint: string
}> = [
  { to: '/', end: true, label: 'Inicio', hint: 'Hoy' },
  { to: '/rutinas', label: 'Rutinas', hint: 'Tu plan' },
  { to: '/historial', label: 'Historial', hint: 'Sesiones' },
  { to: '/caminadora', label: 'Caminadora', hint: 'Cardio' },
  { to: '/progreso', label: 'Ajustes', hint: 'Cuenta y temas' },
]

interface DesktopSidebarProps {
  showBackupBadge?: boolean
}

/** Solo visible en PC (lg+). Mobile sigue con FAB / menú inferior. */
export function DesktopSidebar({ showBackupBadge = false }: DesktopSidebarProps) {
  const { uiLayout } = useTheme()
  const navigate = useNavigate()
  const isFocus = uiLayout === 'focus'

  return (
    <aside
      className={[
        'desktop-sidebar hidden h-full w-56 shrink-0 flex-col border-r border-line lg:flex',
        isFocus ? 'desktop-sidebar--focus' : 'bg-surface-elevated',
      ].join(' ')}
    >
      <div className="desktop-sidebar__brand flex items-center gap-3 border-b border-line px-4 py-5">
        <img
          src="/brand/my-gym-logo.png"
          alt=""
          className="h-11 w-11 object-contain"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold tracking-tight text-fg">
            Mi Gym
          </p>
          <p className="truncate text-xs text-muted">
            {isFocus ? 'Focus · PC' : 'Escritorio'}
          </p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              [
                'rounded-2xl px-3 py-2.5 transition',
                isActive
                  ? isFocus
                    ? 'bg-brand text-chrome-fg shadow-sm'
                    : 'bg-chrome text-chrome-fg'
                  : 'text-fg hover:bg-brand-soft',
              ].join(' ')
            }
          >
            <span className="block text-sm font-semibold">{link.label}</span>
            <span className="block text-xs opacity-70">{link.hint}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => navigate('/progreso#nube')}
          className="relative w-full rounded-2xl bg-brand-soft px-3 py-2.5 text-left text-sm font-semibold text-fg transition hover:opacity-90"
        >
          Cuenta / Nube
          {showBackupBadge ? (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" />
          ) : null}
        </button>
      </div>
    </aside>
  )
}
