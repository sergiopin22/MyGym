import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { isBackupReminderDue } from '../db/backup'
import { useSafeAreaInsets } from '../hooks/useSafeAreaInsets'
import { DesktopSidebar } from './DesktopSidebar'
import { FocusFabMenu } from './FocusFabMenu'

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
  const showBackupBadge = isBackupReminderDue()
  const { top, standalone } = useSafeAreaInsets()
  const isDesktop = useIsDesktopLg()
  const contentTop = isDesktop
    ? Math.max(top + 18, 28)
    : Math.max(top + (standalone ? 32 : 20), standalone ? 80 : 56)

  return (
    <div className="flex h-full max-h-full w-full overflow-hidden">
      <DesktopSidebar showBackupBadge={showBackupBadge} />

      <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden focus-shell lg:mx-0 lg:max-w-none lg:flex-1">
        <main
          className="focus-main min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-6 lg:pb-10 xl:px-10"
          style={{ paddingTop: contentTop }}
        >
          <Outlet />
        </main>

        <div className="lg:hidden">
          <FocusFabMenu showBackupBadge={showBackupBadge} />
        </div>
      </div>
    </div>
  )
}
