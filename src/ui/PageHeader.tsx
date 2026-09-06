import type { ReactNode } from 'react'
import { useTheme } from '../context/ThemeProvider'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** En Focus se muestra como kicker; en Clásico se omite si no aporta. */
  kicker?: string
  back?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  kicker = 'Focus',
  back,
  action,
  className = '',
}: PageHeaderProps) {
  const { uiLayout } = useTheme()
  const isFocus = uiLayout === 'focus'

  return (
    <header
      className={[
        'focus-page-header space-y-2 pt-2',
        isFocus ? 'focus-page-header--active' : '',
        className,
      ].join(' ')}
    >
      {back}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {isFocus ? (
            <p className="focus-page-kicker">{kicker}</p>
          ) : null}
          <h1
            className={[
              'font-display font-extrabold tracking-tight text-fg',
              isFocus ? 'focus-page-title' : 'text-3xl',
            ].join(' ')}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className={isFocus ? 'focus-page-sub' : 'mt-1 text-muted'}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  )
}
