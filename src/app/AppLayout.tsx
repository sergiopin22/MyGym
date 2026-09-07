import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { isBackupReminderDue } from '../db/backup'
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets'
import { useTheme } from '../context/ThemeProvider'
import { AppDrawer } from './AppDrawer'
import { DesktopSidebar } from './DesktopSidebar'
import { FocusFabMenu } from './FocusFabMenu'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function useIsDesktopLg() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setDesktop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return desktop
}

export function AppLayout() {
  const { uiLayout } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const showBackupBadge = isBackupReminderDue()
  const { top, standalone } = useSafeAreaInsets()
  const isDesktop = useIsDesktopLg()
  const contentTop = isDesktop
    ? Math.max(top + 18, 28)
    : Math.max(top + (standalone ? 32 : 20), standalone ? 80 : 56)
  const isFocus = uiLayout === 'focus'

  return (
    <div className="flex h-full max-h-full w-full overflow-hidden">
      <DesktopSidebar showBackupBadge={showBackupBadge} />

      <div
        className={[
          'mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden lg:mx-0 lg:max-w-none lg:flex-1',
          isFocus ? 'focus-shell' : '',
        ].join(' ')}
      >
        <main
          className={[
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            isFocus
              ? 'focus-main pb-28 lg:pb-10 lg:px-6 xl:px-10'
              : 'px-4 pb-4 lg:px-8 lg:pb-8',
            isFocus
              ? 'lg:mx-auto lg:w-full lg:max-w-6xl'
              : 'lg:mx-auto lg:w-full lg:max-w-5xl',
          ].join(' ')}
          style={{ paddingTop: contentTop }}
        >
          <Outlet />
        </main>

        {isFocus ? (
          <div className="lg:hidden">
            <FocusFabMenu showBackupBadge={showBackupBadge} />
          </div>
        ) : (
          <>
            <footer
              className="shrink-0 border-t border-line bg-surface-elevated px-4 pt-2 app-safe-bottom lg:hidden"
              style={{
                paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
              }}
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-chrome text-sm font-semibold text-chrome-fg transition active:scale-[0.98] hover:opacity-90"
                aria-label="Abrir menú"
                aria-expanded={drawerOpen}
              >
                <MenuIcon />
                Menú
                {showBackupBadge ? (
                  <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-danger" />
                ) : null}
              </button>
            </footer>

            <AppDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              showBackupBadge={showBackupBadge}
            />
          </>
        )}
      </div>
    </div>
  )
}
