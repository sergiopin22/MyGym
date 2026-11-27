/** Marca Temach en blanco (sigilo TE limpio + wordmark). */
export function TemachLogoMark({
  className = '',
  showWord = true,
}: {
  className?: string
  showWord?: boolean
}) {
  return (
    <div className={['temach-mark', className].filter(Boolean).join(' ')}>
      <svg
        className="temach-mark__sigil"
        viewBox="0 0 240 240"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          cx="120"
          cy="120"
          r="104"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
        />
        <path
          d="M120 36 L188 176 L52 176 Z"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinejoin="miter"
        />
        <g fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="square">
          <path d="M82 78 V162" />
          <path d="M82 78 H118" />
          <path d="M82 116 H112" />
          <path d="M82 162 H118" />
          <path d="M128 78 V162" />
          <path d="M128 78 H164" />
          <path d="M128 116 H158" />
          <path d="M128 162 H164" />
        </g>
      </svg>
      {showWord ? <p className="temach-mark__word">TEMACH</p> : null}
    </div>
  )
}
