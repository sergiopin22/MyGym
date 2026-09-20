import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BackupPanel } from '../backup/BackupPanel'
import { CloudPanel } from '../cloud/CloudPanel'
import { ThemePicker } from '../settings/ThemePicker'
import { WeightUnitSettings } from '../settings/WeightUnitSettings'
import { PageHeader } from '../../ui/PageHeader'
import { Card } from '../../components/Card'

export function ProgressPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#temas') {
      window.setTimeout(() => {
        document.getElementById('temas')?.scrollIntoView({
          behavior: 'smooth',
        })
      }, 100)
    }
    if (location.hash === '#nube') {
      window.setTimeout(() => {
        document.getElementById('nube')?.scrollIntoView({
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [location.hash])

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Focus · Sistema"
        title="Ajustes"
        subtitle="Temas, nube, respaldo y preferencias."
      />

      <Card className="space-y-2">
        <h2 className="font-display text-lg font-bold">Vista coach</h2>
        <p className="text-sm text-muted">
          Genera un enlace para que tu coach vea máquinas, historial y PRs en
          su celular, sin instalar la app.
        </p>
        <Link
          to="/coach"
          className="ui-btn ui-btn--secondary inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-chrome px-5 text-base font-semibold text-chrome-fg transition active:scale-[0.98]"
        >
          Abrir vista coach
        </Link>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div id="temas" className="space-y-5">
          <ThemePicker />
          <WeightUnitSettings />
        </div>
        <div className="space-y-5">
          <div id="nube">
            <CloudPanel />
          </div>
          <BackupPanel />
        </div>
      </div>
    </div>
  )
}
