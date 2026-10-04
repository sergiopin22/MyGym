import { useEffect, useRef, useState } from 'react'
import { Card } from '../../components/Card'
import type { GiphyGif } from '../../api/giphy'
import { GiphyAvatarPicker } from '../routines/GiphyAvatarPicker'
import {
  clearPrCelebrationGif,
  getPrCelebrationGif,
  savePrCelebrationGifFromFile,
  savePrCelebrationGifFromGiphy,
} from '../../db/prCelebrationGif'
import {
  PR_ANIME_THEMES,
  usePrCelebrationCopy,
} from '../workout/prCelebrationCopy'

interface PrGifPickerProps {
  /** Si true, se ve sobre fondo negro de la preview local. */
  dark?: boolean
  onSaved?: () => void
  /** Busca “asta” al abrir, como en la preview local. */
  autoSearch?: boolean
}

export function PrGifPicker({
  dark = false,
  onSaved,
  autoSearch = false,
}: PrGifPickerProps) {
  const copy = usePrCelebrationCopy()
  const animeName =
    copy.anime === 'custom' ? 'anime' : PR_ANIME_THEMES[copy.anime].name
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<GiphyGif | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gifMime, setGifMime] = useState('image/gif')
  const [title, setTitle] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    let alive = true
    void getPrCelebrationGif().then((row) => {
      if (!alive || !row) return
      url = URL.createObjectURL(row.blob)
      setPreviewUrl(url)
      setTitle(row.title)
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  async function persistFromGiphy(gif: GiphyGif) {
    setSaving(true)
    setError(null)
    try {
      const row = await savePrCelebrationGifFromGiphy(gif)
      setPending(gif)
      setTitle(row.title)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(row.blob)
      })
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el GIF')
    } finally {
      setSaving(false)
    }
  }

  async function persistFromFile(file: File) {
    setSaving(true)
    setError(null)
    try {
      const row = await savePrCelebrationGifFromFile(file)
      setPending(null)
      setTitle(row.title)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(row.blob)
      })
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el archivo')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    setError(null)
    try {
      await clearPrCelebrationGif()
      setPending(null)
      setTitle(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setSaving(false)
    }
  }

  const body = (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">GIF del PR</h2>
        <p className={dark ? 'mt-1 text-sm text-white/70' : 'mt-1 text-sm text-muted'}>
          Elige un GIF de {animeName}. El fondo se agranda borroso; el
          personaje se queda en su tamaño real para no pixelarse. Se guarda en
          este teléfono, no en la nube.
        </p>
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-2xl bg-black p-2 ring-1 ring-white/20">
          <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
            {gifMime.startsWith('video/') ? (
              <video
                src={previewUrl}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#c80000' }}>
              Listo para el corte
            </p>
            <p className="truncate text-sm font-medium text-white">
              {title ?? 'GIF de PR'}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-white/70"
            onClick={() => void remove()}
            disabled={saving}
          >
            Quitar
          </button>
        </div>
      ) : null}

      <GiphyAvatarPicker
        key={copy.giphyQuery}
        selected={pending}
        onSelect={(gif) => {
          if (!gif) {
            setPending(null)
            return
          }
          void persistFromGiphy(gif)
        }}
        defaultQuery={copy.giphyQuery}
        placeholder={`Buscar ${animeName}…`}
        autoSearch={dark || autoSearch}
      />

      <div className="space-y-2">
        <p className={dark ? 'text-xs font-bold uppercase tracking-wide text-white/50' : 'text-xs font-bold uppercase tracking-wide text-muted'}>
          O un archivo tuyo
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/gif,image/webp,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void persistFromFile(file)
          }}
        />
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-base font-semibold text-black transition active:scale-[0.98] disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Elegir GIF del teléfono'}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium" style={{ color: '#c80000' }}>
          {error}
        </p>
      ) : null}
    </div>
  )

  if (dark) return body
  return <Card className="space-y-3">{body}</Card>
}
