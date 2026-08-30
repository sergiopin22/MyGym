import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { isBackupReminderDue } from '../db/backup'
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets'
import { AppDrawer } from './AppDrawer'

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

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const showBackupBadge = isBackupReminderDue()
  const { top, standalone } = useSafeAreaInsets()
  const contentTop = Math.max(top + (standalone ? 32 : 20), standalone ? 80 : 56)

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden">
      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
        style={{ paddingTop: contentTop }}
      >
        <Outlet />
      </main>

      <footer
        className="shrink-0 border-t border-line bg-surface-elevated px-4 pt-2 app-safe-bottom"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
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
    </div>
  )
}
