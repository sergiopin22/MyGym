import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { getRecentGiphyGifs } from '../../brand/recentGiphyGifs'
import {
  isGiphyConfigured,
  searchGiphy,
  type GiphyGif,
} from '../../api/giphy'

interface GiphyAvatarPickerProps {
  selected: GiphyGif | null
  onSelect: (gif: GiphyGif | null) => void
}

function GiphyGifGrid({
  gifs,
  selected,
  onSelect,
}: {
  gifs: GiphyGif[]
  selected: GiphyGif | null
  onSelect: (gif: GiphyGif) => void
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {gifs.map((gif) => {
        const active = selected?.id === gif.id
        return (
          <li key={gif.id}>
            <button
              type="button"
              onClick={() => onSelect(gif)}
              className={[
                'relative aspect-square w-full overflow-hidden rounded-xl bg-black ring-2 transition active:scale-[0.98]',
                active ? 'ring-brand' : 'ring-line hover:ring-brand/50',
              ].join(' ')}
            >
              <img
                src={gif.previewUrl}
                alt={gif.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {active ? (
                <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function GiphyAvatarPicker({ selected, onSelect }: GiphyAvatarPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GiphyGif[]>([])
  const [recentGifs, setRecentGifs] = useState<GiphyGif[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const configured = isGiphyConfigured()

  useEffect(() => {
    setRecentGifs(getRecentGiphyGifs())
  }, [])

  const runSearch = useCallback(async (term: string) => {
    if (!configured) return
    const q = term.trim()
    if (!q) {
      setError('Escribe algo para buscar y ahorrar tu cuota diaria.')
      setResults([])
      setHasSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const rows = await searchGiphy(q)
      setResults(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar en Giphy')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [configured])

  if (!configured) {
    return (
      <div className="rounded-2xl bg-brand-soft px-3 py-4 text-sm text-fg">
        <p className="font-semibold">Giphy no configurado</p>
        <p className="mt-1 text-muted">
          Agrega <code className="text-xs">VITE_GIPHY_API_KEY</code> en tu archivo{' '}
          <code className="text-xs">.env</code> local o en Vercel → Environment
          Variables. Obtén una key gratis en developers.giphy.com
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch(query)
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar GIF (gym, anime, boxing…)"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <Button type="submit" variant="secondary" disabled={loading}>
          Buscar
        </Button>
      </form>

      {selected ? (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-soft/50 p-2 ring-2 ring-brand">
          <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
            <img
              src={selected.previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              Seleccionado
            </p>
            <p className="truncate text-sm font-medium text-fg">{selected.title}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:text-fg"
            onClick={() => onSelect(null)}
          >
            Quitar
          </button>
        </div>
      ) : null}

      {recentGifs.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Usados recientemente
          </p>
          <GiphyGifGrid
            gifs={recentGifs}
            selected={selected}
            onSelect={onSelect}
          />
          <p className="text-[11px] text-muted">
            Sin gastar búsquedas de Giphy — máximo 5.
          </p>
        </section>
      ) : (
        <p className="rounded-xl bg-surface px-3 py-3 text-sm text-muted">
          Tus últimos GIFs elegidos aparecerán aquí. Solo se llama a Giphy cuando
          pulsas <span className="font-semibold text-fg">Buscar</span>.
        </p>
      )}

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      {hasSearched ? (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Resultados
          </p>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted">Buscando…</p>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Sin resultados.</p>
          ) : (
            <GiphyGifGrid gifs={results} selected={selected} onSelect={onSelect} />
          )}
        </section>
      ) : null}

      <p className="text-center text-[10px] text-muted">
        Powered by{' '}
        <a
          href="https://giphy.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline"
        >
          GIPHY
        </a>
      </p>
    </div>
  )
}
