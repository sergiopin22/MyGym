import { Card } from '../../components/Card'
import {
  PR_ANIME_THEMES,
  PR_KICKER_MAX,
  PR_TITLE_MAX,
  patchPrCelebrationPhrase,
  selectPrAnimeTheme,
  usePrCelebrationCopy,
  type PrAnimeId,
} from '../workout/prCelebrationCopy'

const ANIME_ORDER: Array<Exclude<PrAnimeId, 'custom'>> = [
  'clover',
  'goku',
  'ippo',
  'luffy',
  'vinland',
]

interface PrCelebrationAnimePickerProps {
  dark?: boolean
}

export function PrCelebrationAnimePicker({
  dark = false,
}: PrCelebrationAnimePickerProps) {
  const copy = usePrCelebrationCopy()
  const muted = dark ? 'text-white/70' : 'text-muted'
  const labelCls = dark ? 'text-white' : 'text-fg'
  const fieldCls = dark
    ? 'bg-black text-white ring-white/20'
    : 'bg-surface text-fg ring-line'

  const kickerLen = [...copy.kicker].length
  const titleLen = [...copy.title].length

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`font-display text-lg font-bold ${labelCls}`}>
          Tema de anime
        </h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Frases y GIFs de ese anime. Luego puedes cambiar el texto (con tope
          para que no se rompa la pantalla).
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ANIME_ORDER.map((id) => {
          const theme = PR_ANIME_THEMES[id]
          const active = copy.anime === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => selectPrAnimeTheme(id)}
                className={[
                  'w-full rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99]',
                  active
                    ? dark
                      ? 'bg-white/10 ring-white'
                      : 'bg-brand-soft/30 ring-brand'
                    : dark
                      ? 'bg-white/5 ring-white/20'
                      : 'bg-surface ring-line',
                ].join(' ')}
              >
                <span className="mb-2 flex gap-1">
                  <span
                    className="h-2 flex-1 rounded-full ring-1 ring-white/20"
                    style={{ background: theme.palette.bg }}
                  />
                  <span
                    className="h-2 flex-1 rounded-full ring-1 ring-white/20"
                    style={{ background: theme.palette.title }}
                  />
                  <span
                    className="h-2 flex-1 rounded-full ring-1 ring-white/20"
                    style={{ background: theme.palette.kicker }}
                  />
                </span>
                <span className={`block font-display font-bold ${labelCls}`}>
                  {theme.name}
                </span>
                <span className={`block text-xs ${muted}`}>{theme.tagline}</span>
                {active ? (
                  <span className={`mt-1 block text-xs font-semibold ${labelCls}`}>
                    Activo
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {copy.anime === 'custom' ? (
        <p className={`text-xs font-semibold ${muted}`}>Tus frases</p>
      ) : (
        <p className={`text-xs ${muted}`}>
          Toca un campo para pasar a frases tuyas.
        </p>
      )}

      <label className="block space-y-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`text-sm font-semibold ${labelCls}`}>Subtítulo</span>
          <span className={`font-mono text-xs ${muted}`}>
            {kickerLen}/{PR_KICKER_MAX}
          </span>
        </span>
        <input
          type="text"
          maxLength={PR_KICKER_MAX}
          value={copy.kicker}
          onChange={(e) => patchPrCelebrationPhrase('kicker', e.target.value)}
          className={`min-h-11 w-full rounded-xl px-3 ring-1 ${fieldCls}`}
        />
        <span className={`text-xs ${muted}`}>El de arriba, en mayúsculas.</span>
      </label>

      <label className="block space-y-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`text-sm font-semibold ${labelCls}`}>Título</span>
          <span className={`font-mono text-xs ${muted}`}>
            {titleLen}/{PR_TITLE_MAX}
          </span>
        </span>
        <input
          type="text"
          maxLength={PR_TITLE_MAX}
          value={copy.title}
          onChange={(e) => patchPrCelebrationPhrase('title', e.target.value)}
          className={`min-h-11 w-full rounded-xl px-3 ring-1 ${fieldCls}`}
        />
        <span className={`text-xs ${muted}`}>El grande. Máximo 2 líneas.</span>
      </label>
    </div>
  )
}

export function PrCelebrationAnimeSettings() {
  return (
    <Card className="space-y-4">
      <PrCelebrationAnimePicker />
    </Card>
  )
}
