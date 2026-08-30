import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BrandAvatarButton } from '../features/routines/BrandAvatarButton'
import { isBackupReminderDue } from '../db/backup'
import { AppDrawer } from './AppDrawer'

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Inicio'
  if (pathname.startsWith('/rutinas')) return 'Rutinas'
  if (pathname.startsWith('/historial')) return 'Historial'
  if (pathname.startsWith('/progreso')) return 'Ajustes'
  return 'Mi Gym'
}

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
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const showBackupBadge = isBackupReminderDue()
  const title = pageTitle(location.pathname)

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden">
      <header className="app-safe-top z-40 flex shrink-0 items-center gap-2 border-b border-line bg-surface-elevated px-3 pb-2 pt-1">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-fg transition hover:bg-brand-soft active:scale-95"
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
        >
          <MenuIcon />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold tracking-tight text-fg">
          {title}
        </h1>
        <BrandAvatarButton />
      </header>

      <main className="app-safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <Outlet />
      </main>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        showBackupBadge={showBackupBadge}
      />
    </div>
  )
}
