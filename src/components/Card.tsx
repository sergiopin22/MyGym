import type { PropsWithChildren } from 'react'

interface CardProps {
  className?: string
}

/** Contenedor solo cuando hay interacción o agrupación clara */
export function Card({ children, className = '' }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={[
        'rounded-3xl border border-line bg-surface-elevated p-4 shadow-[0_10px_30px_-20px_rgba(12,26,20,0.45)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
