import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PrCountUpPop } from './PrCountUpPop'
import { PrGifPicker } from '../settings/PrGifPicker'
import { PrCelebrationColorsPicker } from '../settings/PrCelebrationColorsPicker'
import { PrCelebrationAnimePicker } from '../settings/PrCelebrationAnimePicker'

/** Datos de mentira. No toca PRs ni el historial. */
const FAKE = {
  exerciseName: 'Press banca',
  fromWeight: 185,
  toWeight: 225,
  fromReps: 6,
  toReps: 8,
}

/**
 * Solo existe en `npm run dev`. Elige un GIF y mira el corte sin romper
 * ninguna marca.
 */
export function PrCelebrationPreviewPage() {
  const [playId, setPlayId] = useState(0)
  const [open, setOpen] = useState(false)

  function replay() {
    setPlayId((n) => n + 1)
    setOpen(true)
  }

  return (
    <div className="pr-limit-preview">
      {open ? (
        <PrCountUpPop
          key={playId}
          {...FAKE}
          stayOpen
          onClose={() => setOpen(false)}
        />
      ) : null}

      <p className="pr-limit-preview__badge">Solo local · no pisa tus PRs</p>
      <h1 className="pr-limit-preview__title">Celebración de PR</h1>
      <p className="pr-limit-preview__lede">
        1. Elige un anime. 2. Toca un GIF. 3. Mira el corte. El peso es de
        mentira.
      </p>
      <button type="button" className="pr-limit-preview__btn" onClick={replay}>
        Ver el corte
      </button>
      <Link to="/" className="pr-limit-preview__back">
        Volver al inicio
      </Link>

      <div className="pr-limit-preview__picker">
        <PrCelebrationAnimePicker dark />
      </div>

      <div className="pr-limit-preview__picker">
        <PrCelebrationColorsPicker dark />
      </div>

      <div className="pr-limit-preview__picker">
        <PrGifPicker dark onSaved={replay} />
      </div>
    </div>
  )
}
