import { useEffect, useRef, useState } from 'react'
import type { GiphyGif } from '../../api/giphy'
import {
  getStoredAvatarMode,
  setStoredAvatarMode,
  type AvatarMode,
} from '../../brand/avatarMode'
import {
  BRAND_AVATARS,
  getBrandAvatar,
  getStoredBrandAvatarId,
  setStoredBrandAvatarId,
  type BrandAvatarId,
} from '../../brand/avatars'
import { Button } from '../../components/Button'
import { saveCustomAvatarFromGiphy, getCustomAvatarRecord } from '../../db/customAvatar'
import { GiphyAvatarPicker } from './GiphyAvatarPicker'

const HINT_MS = 2800

type AvatarTab = 'classic' | 'giphy'

interface BrandAvatarButtonProps {
  className?: string
}

export function BrandAvatarButton({ className = '' }: BrandAvatarButtonProps) {
  const [avatarMode, setAvatarMode] = useState<AvatarMode>(() =>
    typeof window !== 'undefined' ? getStoredAvatarMode() : 'preset',
  )
  const [avatarId, setAvatarId] = useState<BrandAvatarId>(() =>
    typeof window !== 'undefined' ? getStoredBrandAvatarId() : 'ippo',
  )
  const [customSrc, setCustomSrc] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<AvatarTab>('classic')
  const [pendingId, setPendingId] = useState<BrandAvatarId | null>(null)
  const [pendingGiphy, setPendingGiphy] = useState<GiphyGif | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const hintTimer = useRef<number | null>(null)
  const customSrcRef = useRef<string | null>(null)

  const presetAvatar = getBrandAvatar(avatarId)

  async function refreshCustomSrc(mode = avatarMode) {
    if (customSrcRef.current) {
      URL.revokeObjectURL(customSrcRef.current)
      customSrcRef.current = null
    }
    if (mode !== 'custom') {
      setCustomSrc(null)
      return
    }
    const record = await getCustomAvatarRecord()
    if (!record) {
      setCustomSrc(null)
      return
    }
    const url = URL.createObjectURL(record.blob)
    customSrcRef.current = url
    setCustomSrc(url)
  }

  useEffect(() => {
    setAvatarId(getStoredBrandAvatarId())
    const mode = getStoredAvatarMode()
    setAvatarMode(mode)
    void refreshCustomSrc(mode)
    return () => {
      if (customSrcRef.current) URL.revokeObjectURL(customSrcRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    }
  }, [])

  function clearHintTimer() {
    if (hintTimer.current != null) {
      window.clearTimeout(hintTimer.current)
      hintTimer.current = null
    }
  }

  function scheduleHintHide() {
    clearHintTimer()
    hintTimer.current = window.setTimeout(() => {
      setShowHint(false)
      hintTimer.current = null
    }, HINT_MS)
  }

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try {
      if (tab === 'giphy') {
        if (!pendingGiphy) {
          setError('Elige un GIF de la búsqueda.')
          return
        }
        await saveCustomAvatarFromGiphy(pendingGiphy)
        setStoredAvatarMode('custom')
        setAvatarMode('custom')
        await refreshCustomSrc('custom')
      } else {
        const next = pendingId ?? avatarId
        setStoredBrandAvatarId(next)
        setAvatarId(next)
        setStoredAvatarMode('preset')
        setAvatarMode('preset')
        await refreshCustomSrc('preset')
      }
      setPendingId(null)
      setPendingGiphy(null)
      setOpen(false)
      clearHintTimer()
      setShowHint(false)
      try {
        if (navigator.vibrate) navigator.vibrate(12)
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseWithoutChange() {
    setOpen(false)
    setPendingId(null)
    setPendingGiphy(null)
    setError(null)
    scheduleHintHide()
  }

  function handleOpen() {
    clearHintTimer()
    setShowHint(true)
    setPendingId(avatarId)
    setPendingGiphy(null)
    setTab(avatarMode === 'custom' ? 'giphy' : 'classic')
    setError(null)
    setOpen(true)
  }

  const displaySrc = avatarMode === 'custom' && customSrc ? customSrc : presetAvatar.src
  const displayFit =
    avatarMode === 'custom' ? 'cover' : presetAvatar.fit
  const displayLabel =
    avatarMode === 'custom' ? 'GIF personalizado' : presetAvatar.name

  const canConfirm =
    tab === 'classic' ? Boolean(pendingId ?? avatarId) : Boolean(pendingGiphy)

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={[
          'relative shrink-0 overflow-hidden rounded-2xl bg-black ring-1 ring-line transition active:scale-[0.97]',
          'h-28 w-28',
          className,
        ].join(' ')}
        aria-label={`Avatar: ${displayLabel}. Toca para cambiar`}
      >
        <img
          src={displaySrc}
          alt=""
          className={[
            'h-full w-full',
            displayFit === 'cover' ? 'object-cover' : 'object-contain',
          ].join(' ')}
        />
        {showHint ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-center text-[10px] font-bold uppercase tracking-wider text-white">
            Cambiar
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Elige tu avatar"
          onClick={handleCloseWithoutChange}
        >
          <div
            className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface-elevated shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-line px-4 pb-3 pt-4">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Mi Gym
              </p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-fg">
                Elige tu avatar
              </h2>
              <p className="mt-1 text-sm text-muted">
                Clásicos offline o busca un GIF en Giphy (se guarda en este celular).
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTab('classic')}
                  className={[
                    'min-h-10 rounded-xl text-sm font-semibold ring-1 transition',
                    tab === 'classic'
                      ? 'bg-chrome text-chrome-fg ring-chrome'
                      : 'bg-surface text-muted ring-line',
                  ].join(' ')}
                >
                  Clásicos
                </button>
                <button
                  type="button"
                  onClick={() => setTab('giphy')}
                  className={[
                    'min-h-10 rounded-xl text-sm font-semibold ring-1 transition',
                    tab === 'giphy'
                      ? 'bg-chrome text-chrome-fg ring-chrome'
                      : 'bg-surface text-muted ring-line',
                  ].join(' ')}
                >
                  Buscar GIF
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {tab === 'classic' ? (
                <ul className="space-y-3">
                  {BRAND_AVATARS.map((item) => {
                    const selected = (pendingId ?? avatarId) === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setPendingId(item.id)}
                          className={[
                            'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left ring-2 transition active:scale-[0.99]',
                            selected
                              ? 'bg-brand-soft ring-brand'
                              : 'bg-surface ring-line hover:ring-brand/40',
                          ].join(' ')}
                        >
                          <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-line">
                            <img
                              src={item.src}
                              alt=""
                              className={[
                                'h-full w-full',
                                item.fit === 'cover' ? 'object-cover' : 'object-contain',
                              ].join(' ')}
                            />
                            {selected ? (
                              <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg shadow">
                                ✓
                              </span>
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-lg font-extrabold text-fg">
                              {item.name}
                            </span>
                            <span className="mt-0.5 block text-sm font-semibold text-brand">
                              {item.tagline}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <GiphyAvatarPicker
                  selected={pendingGiphy}
                  onSelect={setPendingGiphy}
                />
              )}
            </div>

            {error ? (
              <p className="px-4 pb-2 text-sm font-medium text-danger">{error}</p>
            ) : null}

            <div className="flex gap-2 border-t border-line px-4 py-3">
              <Button
                fullWidth
                variant="secondary"
                disabled={saving}
                onClick={handleCloseWithoutChange}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                disabled={saving || !canConfirm}
                onClick={() => void handleConfirm()}
              >
                {saving ? 'Guardando…' : 'Usar este'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
