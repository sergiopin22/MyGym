import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden">
      <main className="app-safe-top min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
