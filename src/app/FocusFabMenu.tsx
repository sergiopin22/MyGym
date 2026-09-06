import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrPanel } from '../features/routines/PrPanel'

interface FocusFabMenuProps {
  showBackupBadge?: boolean
}

type ArcAction =
  | { id: string; label: string; kind: 'path'; path: string }
  | { id: string; label: string; kind: 'prs' }

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconRun() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="14.5" cy="5.5" r="1.7" fill="currentColor" />
      <path
        d="M7 20l2.2-4.2L13 14l2 3 3 1M9.2 15.8 7 12l3-2 3.5 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8 4h8v4a4 4 0 0 1-8 0V4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 6H5.5A2.5 2.5 0 0 0 5.5 11H8M16 6h2.5a2.5 2.5 0 0 1 0 5H16M10 16h4v2.5a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 10 18.5V16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.9 7.1l1.6 1.6M17.5 15.3l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 16.9l1.6-1.6M17.5 8.7l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ARC_ITEMS: Array<
  ArcAction & { icon: ReactNode; phiDeg: number }
> = [
  /* Semicírculo hacia arriba (FAB abajo-centro). 0° = arriba. */
  { id: 'home', label: 'Inicio', kind: 'path', path: '/', icon: <IconHome />, phiDeg: -86 },
  { id: 'routines', label: 'Rutinas', kind: 'path', path: '/rutinas', icon: <IconList />, phiDeg: -56 },
  { id: 'history', label: 'Historial', kind: 'path', path: '/historial', icon: <IconClock />, phiDeg: -30 },
  { id: 'cardio', label: 'Caminadora', kind: 'path', path: '/caminadora', icon: <IconRun />, phiDeg: 30 },
  { id: 'prs', label: 'PRs', kind: 'prs', icon: <IconTrophy />, phiDeg: 56 },
  { id: 'settings', label: 'Ajustes', kind: 'path', path: '/progreso', icon: <IconGear />, phiDeg: 86 },
]

const RADIUS = 150
/** Labels horizontales justo encima de cada ícono */
const LABEL_LIFT = 40

export function FocusFabMenu({ showBackupBadge = false }: FocusFabMenuProps) {
  const [open, setOpen] = useState(false)
  const [prsOpen, setPrsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleItem(item: ArcAction) {
    setOpen(false)
    if (item.kind === 'prs') {
      setPrsOpen(true)
      return
    }
    navigate(item.path)
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="focus-fab-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className={['focus-fab-root', open ? 'focus-fab-root--open' : ''].join(' ')}>
        <div className="focus-fab-glow" aria-hidden />

        {ARC_ITEMS.map((item, index) => {
          const rad = (item.phiDeg * Math.PI) / 180
          // 0° = arriba, negativo = izquierda, positivo = derecha
          const x = Math.sin(rad) * RADIUS
          const y = -Math.cos(rad) * RADIUS
          const lx = x
          const ly = y - LABEL_LIFT
          const delay = `${40 + index * 35}ms`

          return (
            <div key={item.id} className="focus-fab-slot">
              <button
                type="button"
                className={[
                  'focus-fab-arc-btn',
                  open ? 'focus-fab-arc-btn--open' : '',
                ].join(' ')}
                style={
                  {
                    '--fab-x': `${x}px`,
                    '--fab-y': `${y}px`,
                    '--fab-delay': delay,
                  } as CSSProperties
                }
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                aria-label={item.label}
                onClick={() => handleItem(item)}
              >
                {item.icon}
                {item.id === 'settings' && showBackupBadge ? (
                  <span className="focus-fab-arc-btn__badge" />
                ) : null}
              </button>

              <span
                className={[
                  'focus-fab-arc-label',
                  open ? 'focus-fab-arc-label--open' : '',
                ].join(' ')}
                style={
                  {
                    '--fab-x': `${lx}px`,
                    '--fab-y': `${ly}px`,
                    '--fab-delay': delay,
                  } as CSSProperties
                }
                aria-hidden
              >
                {item.label}
              </span>
            </div>
          )
        })}

        <button
          type="button"
          className={[
            'focus-fab-main',
            open ? 'focus-fab-main--open' : '',
          ].join(' ')}
          aria-label={open ? 'Cerrar menú Focus' : 'Abrir menú Focus'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="focus-fab-main__icon" aria-hidden>
            {open ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path
                  d="M5 8h14M5 12h14M5 16h10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
          {showBackupBadge && !open ? (
            <span className="focus-fab-main__badge" />
          ) : null}
        </button>
      </div>

      {prsOpen ? (
        <div className="focus-prs-sheet focus-prs-sheet--reel" role="dialog" aria-modal="true">
          <button
            type="button"
            className="focus-prs-sheet__scrim"
            aria-label="Cerrar PRs"
            onClick={() => setPrsOpen(false)}
          />
          <div className="focus-prs-sheet__panel focus-prs-sheet__panel--reel">
            <PrPanel
              active
              onClose={() => setPrsOpen(false)}
              showCloseButton
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
