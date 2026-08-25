import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import {
  BRAND_AVATARS,
  getBrandAvatar,
  getStoredBrandAvatarId,
  setStoredBrandAvatarId,
  type BrandAvatarId,
} from '../../brand/avatars'

const HINT_MS = 2800

interface BrandAvatarButtonProps {
  className?: string
}

export function BrandAvatarButton({ className = '' }: BrandAvatarButtonProps) {
  const [avatarId, setAvatarId] = useState<BrandAvatarId>(() =>
    typeof window !== 'undefined' ? getStoredBrandAvatarId() : 'ippo',
  )
  const [open, setOpen] = useState(false)
  const [pendingId, setPendingId] = useState<BrandAvatarId | null>(null)
  const [showHint, setShowHint] = useState(false)
  const hintTimer = useRef<number | null>(null)

  useEffect(() => {
    setAvatarId(getStoredBrandAvatarId())
  }, [])

  useEffect(() => {
    return () => {
      if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    }
  }, [])

  const avatar = getBrandAvatar(avatarId)

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

  function handleConfirm() {
    const next = pendingId ?? avatarId
    setStoredBrandAvatarId(next)
    setAvatarId(next)
    setPendingId(null)
    setOpen(false)
    clearHintTimer()
    setShowHint(false)
    try {
      if (navigator.vibrate) navigator.vibrate(12)
    } catch {
      /* ignore */
    }
  }

  function handleCloseWithoutChange() {
    setOpen(false)
    setPendingId(null)
    /** Si no cambió, el texto “Cambiar” se quita solo a los pocos segundos */
    scheduleHintHide()
  }

  function handleOpen() {
    clearHintTimer()
    setShowHint(true)
    setPendingId(avatarId)
    setOpen(true)
  }

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
        aria-label={`Avatar: ${avatar.name}. Toca para cambiar de luchador`}
      >
        <img
          src={avatar.src}
          alt=""
          className={[
            'h-full w-full',
            avatar.fit === 'cover' ? 'object-cover' : 'object-contain',
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
          aria-label="Elige tu luchador"
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
                Elige tu luchador
              </h2>
              <p className="mt-1 text-sm text-muted">
                Se guarda en este celular. Tócalo cuando quieras cambiar.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {BRAND_AVATARS.map((item) => {
                const selected = (pendingId ?? avatarId) === item.id
                return (
                  <button
                    key={item.id}
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
                )
              })}
            </div>

            <div className="flex gap-2 border-t border-line px-4 py-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={handleCloseWithoutChange}
              >
                Cancelar
              </Button>
              <Button fullWidth onClick={handleConfirm}>
                Usar este
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
