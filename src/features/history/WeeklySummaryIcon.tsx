/** Corona + 3 barras (subió / igual / bajó) para el resumen semanal. */
export function WeeklySummaryIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className || 'weekly-summary-icon'}
      fill="none"
      aria-hidden
    >
      <path
        d="M8 14.5 12.2 10l5.3 5.2L22.8 9l5.2 5.5L32 12.8V18.5H8V14.5Z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M11 18.5h18v2.2c0 1.2-.9 2.2-2.1 2.2H13.1c-1.2 0-2.1-1-2.1-2.2V18.5Z"
        fill="#F59E0B"
      />
      {/* Verde = subió (más alto), azul = igual, rojo = bajó */}
      <rect x="9" y="20" width="6" height="16" rx="1.4" fill="#22C55E" />
      <rect x="17" y="24" width="6" height="12" rx="1.4" fill="#3B82F6" />
      <rect x="25" y="28" width="6" height="8" rx="1.4" fill="#EF4444" />
    </svg>
  )
}
