/** Logo oficial Temach (imagen, no SVG generado). */
export function TemachLogoMark({
  className = '',
  decorative = false,
}: {
  className?: string
  decorative?: boolean
}) {
  return (
    <img
      className={['temach-mark', className].filter(Boolean).join(' ')}
      src="/brand/temach-logo.png"
      alt={decorative ? '' : 'Temach'}
      draggable={false}
      decoding="async"
    />
  )
}
