import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg shadow-sm hover:bg-accent-strong active:scale-[0.98]',
  secondary:
    'bg-chrome text-chrome-fg hover:bg-chrome-soft active:scale-[0.98]',
  ghost: 'bg-transparent text-fg hover:bg-brand-soft',
  danger:
    'bg-danger text-danger-fg hover:bg-danger-strong active:scale-[0.98]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
