import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  NavHistoryIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavPlayIcon,
  NavRoutinesIcon,
} from '../components/BottomNavIcons'
import { isBackupReminderDue } from '../db/backup'
import { MoreMenuSheet } from './MoreMenuSheet'
import { useWorkoutFabAction } from './useWorkoutFabAction'

const routeTabs = [
  { to: '/', label: 'Inicio', end: true, icon: NavHomeIcon },
  { to: '/rutinas', label: 'Rutinas', icon: NavRoutinesIcon },
  { to: '/historial', label: 'Historial', icon: NavHistoryIcon },
] as const

function navTapFeedback() {
  if (navigator.vibrate) navigator.vibrate(10)
}

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [fabRefresh, setFabRefresh] = useState(0)
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(
    null,
  )
  const innerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([])

  const { state: fabState, busy, error, runAction, clearError } =
    useWorkoutFabAction(fabRefresh)

  const showBackupBadge = isBackupReminderDue()
  const activeRouteIndex = routeTabs.findIndex((tab) =>
    'end' in tab && tab.end
      ? location.pathname === tab.to
      : location.pathname === tab.to ||
        location.pathname.startsWith(`${tab.to}/`),
  )

  useEffect(() => {
    if (location.pathname === '/progreso') return
    setFabRefresh((n) => n + 1)
  }, [location.pathname])

  useEffect(() => {
    if (activeRouteIndex < 0) {
      setPillStyle(null)
      return
    }
    const el = tabRefs.current[activeRouteIndex]
    const inner = innerRef.current
    if (!el || !inner) return

    const innerRect = inner.getBoundingClientRect()
    const tabRect = el.getBoundingClientRect()
    setPillStyle({
      left: tabRect.left - innerRect.left + 4,
      width: tabRect.width - 8,
    })
  }, [activeRouteIndex, location.pathname, moreOpen])

  async function handleFabClick() {
    navTapFeedback()
    clearError()
    await runAction(navigate)
  }

  return (
    <>
      {error ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-50 mx-auto max-w-lg px-4"
          style={{ bottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}
        >
          <p className="rounded-2xl bg-danger px-3 py-2 text-center text-sm font-semibold text-danger-fg shadow-lg">
            {error}
          </p>
        </div>
      ) : null}

      <nav
        className="relative z-40 shrink-0 border-t border-line/80 bg-surface-elevated"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegación principal"
      >
        <div ref={innerRef} className="relative px-1 pt-2">
          {pillStyle ? (
            <span
              className="bottom-nav-pill pointer-events-none absolute top-2 h-14 rounded-2xl bg-brand-soft"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
              }}
              aria-hidden
            />
          ) : null}

          <ul className="relative grid grid-cols-5 items-end gap-0 pb-1.5">
            {routeTabs.slice(0, 2).map((tab, index) => (
              <li key={tab.to}>
                <NavLink
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  to={tab.to}
                  end={'end' in tab ? tab.end : false}
                  onClick={navTapFeedback}
                  className={({ isActive }) =>
                    [
                      'bottom-nav-tab flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 pb-0.5 pt-1.5 text-[11px] font-semibold transition',
                      isActive ? 'text-brand' : 'text-muted hover:text-fg',
                    ].join(' ')
                  }
                >
                  <tab.icon
                    className={[
                      'h-5 w-5 transition',
                      activeRouteIndex === index ? 'scale-110' : '',
                    ].join(' ')}
                  />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            ))}

            <li className="flex flex-col items-center justify-end">
              <button
                type="button"
                onClick={() => void handleFabClick()}
                disabled={busy || fabState.mode === 'loading'}
                aria-label={fabState.ariaLabel}
                className={[
                  'bottom-nav-fab -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg ring-4 ring-surface-elevated transition active:scale-95 disabled:opacity-60',
                  fabState.mode === 'continue' ? 'bottom-nav-fab-live' : '',
                ].join(' ')}
              >
                <NavPlayIcon className="h-8 w-8" />
              </button>
              <span
                className={[
                  'mt-1 min-h-[1rem] text-[11px] font-semibold leading-none',
                  fabState.mode === 'continue'
                    ? 'text-accent'
                    : fabState.mode === 'view_today'
                      ? 'text-brand'
                      : 'text-fg',
                ].join(' ')}
              >
                {busy ? '…' : fabState.label}
              </span>
            </li>

            {routeTabs.slice(2).map((tab, offset) => {
              const index = offset + 2
              return (
                <li key={tab.to}>
                  <NavLink
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    to={tab.to}
                    onClick={navTapFeedback}
                    className={({ isActive }) =>
                      [
                        'bottom-nav-tab flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 pb-0.5 pt-1.5 text-[11px] font-semibold transition',
                        isActive ? 'text-brand' : 'text-muted hover:text-fg',
                      ].join(' ')
                    }
                  >
                    <tab.icon
                      className={[
                        'h-5 w-5 transition',
                        activeRouteIndex === index ? 'scale-110' : '',
                      ].join(' ')}
                    />
                    <span>{tab.label}</span>
                  </NavLink>
                </li>
              )
            })}

            <li>
              <button
                type="button"
                onClick={() => {
                  navTapFeedback()
                  setMoreOpen(true)
                }}
                className={[
                  'bottom-nav-tab relative flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 pb-0.5 pt-1.5 text-[11px] font-semibold transition',
                  moreOpen || location.pathname === '/progreso'
                    ? 'text-brand'
                    : 'text-muted hover:text-fg',
                ].join(' ')}
                aria-label="Más opciones"
                aria-expanded={moreOpen}
              >
                <span className="relative">
                  <NavMoreIcon className="h-5 w-5" />
                  {showBackupBadge ? (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface-elevated" />
                  ) : null}
                </span>
                <span>Más</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <MoreMenuSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        showBackupBadge={showBackupBadge}
      />
    </>
  )
}
