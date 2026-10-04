import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { PageHeader } from '../../ui/PageHeader'
import { getPrCelebrationGif } from '../../db/prCelebrationGif'
import { PrGifPicker } from './PrGifPicker'
import { PrCelebrationColorsSettings } from './PrCelebrationColorsPicker'
import { PrCelebrationAnimeSettings } from './PrCelebrationAnimePicker'
import { PrCountUpPop } from '../workout/PrCountUpPop'
import {
  PR_CELEBRATION_PRESETS,
  usePrCelebrationColors,
} from '../workout/prCelebrationColors'
import { prAnimeLabel, usePrCelebrationCopy } from '../workout/prCelebrationCopy'

const FAKE = {
  exerciseName: 'Press banca',
  fromWeight: 185,
  toWeight: 225,
  fromReps: 6,
  toReps: 8,
}

/** Tarjeta corta en Ajustes. El detalle vive en /progreso/animacion-pr. */
export function PrCelebrationSettingsEntry() {
  const colors = usePrCelebrationColors()
  const copy = usePrCelebrationCopy()
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [gifTitle, setGifTitle] = useState<string | null>(null)
  const [gifMime, setGifMime] = useState('image/gif')

  useEffect(() => {
    let url: string | null = null
    let alive = true
    void getPrCelebrationGif().then((row) => {
      if (!alive || !row) return
      url = URL.createObjectURL(row.blob)
      setGifUrl(url)
      setGifTitle(row.title)
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">Animación de PR</h2>
        <p className="mt-1 text-sm text-muted">
          GIF, fondo, colores del título, números y el botón Seguir. El corte
          que sale cuando rompes un récord.
        </p>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-2 ring-1 ring-line"
        style={{ background: colors.bg }}
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
          {gifUrl ? (
            gifMime.startsWith('video/') ? (
              <video
                src={gifUrl}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img src={gifUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[0.65rem] font-bold uppercase tracking-wide text-white/40">
              GIF
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {gifTitle ?? 'Sin GIF todavía'}
          </p>
          <p className="text-xs text-white/60">
            {prAnimeLabel(copy)} ·{' '}
            {colors.preset === 'custom'
              ? 'Tus colores'
              : PR_CELEBRATION_PRESETS[colors.preset].name}
          </p>
        </div>
        <span className="flex shrink-0 gap-1">
          <span
            className="h-6 w-6 rounded-md ring-1 ring-white/20"
            style={{ background: colors.bg }}
          />
          <span
            className="h-6 w-6 rounded-md ring-1 ring-white/20"
            style={{ background: colors.kicker }}
          />
          <span
            className="h-6 w-6 rounded-md ring-1 ring-white/20"
            style={{ background: colors.button }}
          />
        </span>
      </div>

      <Link
        to="/progreso/animacion-pr"
        className="ui-btn ui-btn--secondary inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-chrome px-5 text-base font-semibold text-chrome-fg transition active:scale-[0.98]"
      >
        Configurar animación de PR
      </Link>
    </Card>
  )
}

export function PrCelebrationSettingsPage() {
  const [playId, setPlayId] = useState(0)
  const [open, setOpen] = useState(false)

  function replay() {
    setPlayId((n) => n + 1)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      {open ? (
        <PrCountUpPop
          key={playId}
          {...FAKE}
          stayOpen
          onClose={() => setOpen(false)}
        />
      ) : null}

      <PageHeader
        kicker="Focus · PR"
        title="Animación de PR"
        subtitle="GIF, paleta y una prueba. El peso es de mentira: no pisa tus marcas."
        back={
          <Link
            to="/progreso"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
          >
            ← Ajustes
          </Link>
        }
      />

      <Card className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">Probar el corte</h2>
          <p className="mt-1 text-sm text-muted">
            Míralo con el GIF y los colores que tengas ahora.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-chrome px-5 text-base font-semibold text-chrome-fg transition active:scale-[0.98]"
          onClick={replay}
        >
          Ver el corte
        </button>
      </Card>

      <PrCelebrationAnimeSettings />
      <PrCelebrationColorsSettings />
      <PrGifPicker autoSearch onSaved={replay} />
    </div>
  )
}
