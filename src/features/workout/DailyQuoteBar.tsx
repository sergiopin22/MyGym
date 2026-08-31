import type { MotivationQuote } from '../../content/motivationQuotes'

interface DailyQuoteBarProps {
  quote: MotivationQuote
}

export function DailyQuoteBar({ quote }: DailyQuoteBarProps) {
  return (
    <div
      className="shrink-0 border-b border-line bg-brand-soft/40 px-3 py-2.5"
      role="note"
      aria-label="Frase del día"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
        Frase del día
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-fg">{quote.text}</p>
    </div>
  )
}
