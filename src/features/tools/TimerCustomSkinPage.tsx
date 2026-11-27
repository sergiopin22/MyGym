import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../ui/PageHeader'
import { setTimerDesign } from '../../utils/restTimer'
import {
  getActiveCustomSkinId,
  listCustomSkins,
  MAX_TIMER_CUSTOM_SKINS,
  setActiveCustomSkinId,
} from './timerCustomSkin'

export function TimerCustomSkinPage() {
  const skins = listCustomSkins()
  const activeId = getActiveCustomSkinId()
  const canCreate = skins.length < MAX_TIMER_CUSTOM_SKINS

  function useSkin(id: string) {
    setActiveCustomSkinId(id)
    setTimerDesign('custom')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Focus · Timer"
        title="Mis diseños"
        subtitle="Crea skins con tu GIF, color y frases. Hasta 8."
        back={
          <Link
            to="/temporizador"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Temporizador
          </Link>
        }
      />

      {canCreate ? (
        <Link to="/temporizador/personalizar/nuevo">
          <Button fullWidth>Crear diseño</Button>
        </Link>
      ) : (
        <p className="text-sm font-medium text-danger">
          Límite de {MAX_TIMER_CUSTOM_SKINS} diseños. Borra uno para crear otro.
        </p>
      )}

      {skins.length === 0 ? (
        <Card>
          <p className="font-display text-lg font-bold">Sin diseños aún</p>
          <p className="mt-1 text-sm text-muted">
            Crea el primero: elige un GIF, un color y tus frases.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {skins.map((skin) => {
            const active = skin.id === activeId
            return (
              <li key={skin.id}>
                <Card className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-8 w-8 shrink-0 rounded-lg ring-1 ring-line"
                      style={{ backgroundColor: skin.accent }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold">{skin.name}</p>
                      <p className="truncate text-sm text-muted">
                        {skin.title}
                        {skin.subtitle ? ` · ${skin.subtitle}` : ''}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                        {skin.scene} · {skin.anim}
                        {skin.hasGif ? ' · GIF' : ''}
                        {active ? ' · Activo' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="min-h-11 flex-1 rounded-xl bg-accent px-3 text-sm font-bold uppercase tracking-wide text-accent-fg"
                      onClick={() => useSkin(skin.id)}
                    >
                      Usar
                    </button>
                    <Link
                      to={`/temporizador/personalizar/${skin.id}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-surface px-3 text-sm font-bold uppercase tracking-wide text-fg ring-1 ring-line"
                    >
                      Editar
                    </Link>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
