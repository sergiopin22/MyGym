import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BackupPanel } from '../backup/BackupPanel'
import { ThemePicker } from '../settings/ThemePicker'
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
  }, [location.hash])

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Focus · Sistema"
        title="Ajustes"
        subtitle="Temas, respaldo y preferencias."
      />

      <div id="temas">
        <ThemePicker />
      </div>

      <BackupPanel />
    </div>
  )
}
