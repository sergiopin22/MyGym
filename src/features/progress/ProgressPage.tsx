import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BackupPanel } from '../backup/BackupPanel'
import { CloudPanel } from '../cloud/CloudPanel'
import { ThemePicker } from '../settings/ThemePicker'
import { WeightUnitSettings } from '../settings/WeightUnitSettings'
import { PageHeader } from '../../ui/PageHeader'

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
