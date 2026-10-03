import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  kicker?: string
  back?: ReactNode
  action?: ReactNode
  className?: string
  /** Conservado por la vista coach; Focus es el único layout. */
  forceFocus?: boolean
}

export function PageHeader({
  title,
  subtitle,
  kicker = 'Focus',
  back,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={['focus-page-header focus-page-header--active space-y-2 pt-2', className].join(
        ' ',
      )}
    >
      {back}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="focus-page-kicker">{kicker}</p>
          <h1 className="focus-page-title font-display font-extrabold tracking-tight text-fg">
            {title}
          </h1>
          {subtitle ? <p className="focus-page-sub">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  )
}
