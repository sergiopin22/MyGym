import type { MotivationQuote } from '../../content/motivationQuotes'
import { useTheme } from '../../context/ThemeProvider'

interface DailyQuoteBarProps {
  quote: MotivationQuote
}

export function DailyQuoteBar({ quote }: DailyQuoteBarProps) {
  const { themeId } = useTheme()
  const label = themeId === 'temach' ? 'Modo disciplina' : 'Frase del día'

  return (
    <div
      className="daily-quote-bar shrink-0 border-b border-line bg-brand-soft/40 px-3 py-2.5"
      role="note"
      aria-label={label}
    >
      <p className="daily-quote-bar__label text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-fg">{quote.text}</p>
    </div>
  )
}
