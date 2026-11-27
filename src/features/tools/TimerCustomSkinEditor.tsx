import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { GiphyGif } from '../../api/giphy'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import {
  clearTimerCustomGif,
  getTimerCustomGif,
  saveTimerCustomGifFromFile,
  saveTimerCustomGifFromGiphy,
} from '../../db/timerCustomSkin'
import { PageHeader } from '../../ui/PageHeader'
import { GiphyAvatarPicker } from '../routines/GiphyAvatarPicker'
import { setTimerDesign } from '../../utils/restTimer'
import {
  createEmptyCustomSkin,
  deleteCustomSkinMeta,
  getCustomSkin,
  listCustomSkins,
  MAX_TIMER_CUSTOM_SKINS,
  setActiveCustomSkinId,
  TIMER_ACCENT_PRESETS,
  TIMER_ANIM_OPTIONS,
  TIMER_SCENE_OPTIONS,
  upsertCustomSkin,
  type TimerCustomAnim,
  type TimerCustomScene,
  type TimerCustomSkinMeta,
} from './timerCustomSkin'

export function TimerCustomSkinEditor() {
  const { skinId } = useParams()
  const navigate = useNavigate()
  const isNew = !skinId || skinId === 'nuevo'
  const [draft, setDraft] = useState<TimerCustomSkinMeta>(() => {
    if (!isNew && skinId) {
      return getCustomSkin(skinId) ?? createEmptyCustomSkin()
    }
    return createEmptyCustomSkin()
  })
  const [quotesText, setQuotesText] = useState(() => draft.quotes.join('\n'))
  const [pendingGif, setPendingGif] = useState<GiphyGif | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gifMime, setGifMime] = useState('image/gif')
  const [gifTitle, setGifTitle] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const atLimit =
    isNew && listCustomSkins().length >= MAX_TIMER_CUSTOM_SKINS

  useEffect(() => {
    if (isNew || !skinId) return
    const existing = getCustomSkin(skinId)
    if (!existing) {
      navigate('/temporizador/personalizar', { replace: true })
      return
    }
    setDraft(existing)
    setQuotesText(existing.quotes.join('\n'))
  }, [isNew, skinId, navigate])

  useEffect(() => {
    let url: string | null = null
    let alive = true
    void getTimerCustomGif(draft.id).then((row) => {
      if (!alive) return
      if (!row) {
        setPreviewUrl(null)
        setGifTitle(null)
        return
      }
      url = URL.createObjectURL(row.blob)
      setPreviewUrl(url)
      setGifTitle(row.title)
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [draft.id])

  function patch(partial: Partial<TimerCustomSkinMeta>) {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  async function persistGifFromGiphy(gif: GiphyGif) {
    setSaving(true)
    setError(null)
    try {
      const row = await saveTimerCustomGifFromGiphy(draft.id, gif)
      setPendingGif(gif)
      setGifTitle(row.title)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(row.blob)
      })
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
      patch({ hasGif: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el GIF')
    } finally {
      setSaving(false)
    }
  }

  async function persistGifFromFile(file: File) {
    setSaving(true)
    setError(null)
    try {
      const row = await saveTimerCustomGifFromFile(draft.id, file)
      setPendingGif(null)
      setGifTitle(row.title)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(row.blob)
      })
      setGifMime(row.mimeType || row.blob.type || 'image/gif')
      patch({ hasGif: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el archivo',
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeGif() {
    setSaving(true)
    setError(null)
    try {
      await clearTimerCustomGif(draft.id)
      setPendingGif(null)
      setGifTitle(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      patch({ hasGif: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
    } finally {
      setSaving(false)
    }
  }

  function save() {
    if (atLimit) {
      setError(`Máximo ${MAX_TIMER_CUSTOM_SKINS} diseños. Borra uno antes.`)
      return
    }
    const quotes = quotesText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean)
    const saved = upsertCustomSkin({
      ...draft,
      quotes,
      hasGif: Boolean(previewUrl) || draft.hasGif,
    })
    setActiveCustomSkinId(saved.id)
    setTimerDesign('custom')
    navigate('/temporizador')
  }

  async function removeSkin() {
    if (isNew) {
      navigate('/temporizador/personalizar')
      return
    }
    setSaving(true)
    try {
      await clearTimerCustomGif(draft.id)
      deleteCustomSkinMeta(draft.id)
      navigate('/temporizador/personalizar')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Focus · Timer"
        title={isNew ? 'Crear diseño' : 'Editar diseño'}
        subtitle="GIF, color, textos y estilo para tu timer fullscreen."
        back={
          <Link
            to="/temporizador/personalizar"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Mis diseños
          </Link>
        }
      />

      {atLimit ? (
        <p className="text-sm font-medium text-danger">
          Ya tienes {MAX_TIMER_CUSTOM_SKINS} diseños. Borra uno para crear otro.
        </p>
      ) : null}

      <Card className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Nombre
          </span>
          <input
            className="ui-field w-full rounded-xl border-0 bg-surface px-3 py-3 text-fg"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            maxLength={40}
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Color acento
          </p>
          <div className="flex flex-wrap gap-2">
            {TIMER_ACCENT_PRESETS.map((row) => {
              const active = draft.accent === row.color
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => patch({ accent: row.color })}
                  className={[
                    'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ring-1 transition',
                    active
                      ? 'ring-brand bg-brand-soft'
                      : 'ring-line bg-surface',
                  ].join(' ')}
                >
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-line"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Título
          </span>
          <input
            className="ui-field w-full rounded-xl border-0 bg-surface px-3 py-3 text-fg"
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            maxLength={28}
            placeholder="MODO GUERRA"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Subtítulo
          </span>
          <input
            className="ui-field w-full rounded-xl border-0 bg-surface px-3 py-3 text-fg"
            value={draft.subtitle}
            onChange={(e) => patch({ subtitle: e.target.value })}
            maxLength={40}
            placeholder="EJÉRCITO DE LOS COMPAS"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Frases (una por línea)
          </span>
          <textarea
            className="ui-field min-h-28 w-full rounded-xl border-0 bg-surface px-3 py-3 text-fg"
            value={quotesText}
            onChange={(e) => setQuotesText(e.target.value)}
            placeholder={'Disciplina > motivación\nUn round más'}
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Escena
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TIMER_SCENE_OPTIONS.map((row) => {
              const active = draft.scene === row.id
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => patch({ scene: row.id as TimerCustomScene })}
                  className={[
                    'rounded-xl px-3 py-3 text-left ring-1 transition',
                    active
                      ? 'ring-brand bg-brand-soft'
                      : 'ring-line bg-surface',
                  ].join(' ')}
                >
                  <p className="font-display text-sm font-bold uppercase">
                    {row.label}
                  </p>
                  <p className="text-xs text-muted">{row.tagline}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Animación
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TIMER_ANIM_OPTIONS.map((row) => {
              const active = draft.anim === row.id
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => patch({ anim: row.id as TimerCustomAnim })}
                  className={[
                    'rounded-xl px-3 py-3 text-left ring-1 transition',
                    active
                      ? 'ring-brand bg-brand-soft'
                      : 'ring-line bg-surface',
                  ].join(' ')}
                >
                  <p className="font-display text-sm font-bold uppercase">
                    {row.label}
                  </p>
                  <p className="text-xs text-muted">{row.tagline}</p>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">GIF</h2>
          <p className="mt-1 text-sm text-muted">
            Busca en Giphy o sube un archivo. Se muestra arriba del reloj.
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
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                Listo
              </p>
              <p className="truncate text-sm font-medium text-white">
                {gifTitle ?? 'GIF del timer'}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-white/70"
              onClick={() => void removeGif()}
              disabled={saving}
            >
              Quitar
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">Todavía no hay GIF.</p>
        )}

        <GiphyAvatarPicker
          selected={pendingGif}
          onSelect={(gif) => {
            if (!gif) {
              setPendingGif(null)
              return
            }
            void persistGifFromGiphy(gif)
          }}
          defaultQuery="gym anime boxing"
          placeholder="Buscar GIF…"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/gif,image/webp,image/png,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void persistGifFromFile(file)
          }}
        />
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-surface px-5 text-base font-semibold text-fg ring-1 ring-line transition active:scale-[0.98] disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
          disabled={saving}
        >
          Subir archivo
        </button>
      </Card>

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={save} disabled={saving || atLimit}>
          Guardar y usar
        </Button>
        {!isNew ? (
          <button
            type="button"
            className="min-h-12 rounded-2xl text-sm font-semibold text-danger"
            onClick={() => void removeSkin()}
            disabled={saving}
          >
            Borrar este diseño
          </button>
        ) : null}
      </div>
    </div>
  )
}
