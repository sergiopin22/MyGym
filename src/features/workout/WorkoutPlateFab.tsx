import { useEffect, useState } from 'react'
import { PlateCalcIcon, PlateCalculator } from '../tools/PlateCalculator'

/** Botón flotante fijo en el entreno → abre la calculadora de discos. */
export function WorkoutPlateFab() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="workout-plate-fab"
        aria-label="Abrir calculadora de discos"
        onClick={() => setOpen(true)}
      >
        <PlateCalcIcon className="h-5 w-5" />
        <span>Discos</span>
      </button>

      {open ? (
        <div
          className="workout-plate-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Calculadora de discos"
        >
          <button
            type="button"
            className="workout-plate-sheet__scrim"
            aria-label="Cerrar calculadora"
            onClick={() => setOpen(false)}
          />
          <div className="workout-plate-sheet__panel">
            <PlateCalculator compact onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
