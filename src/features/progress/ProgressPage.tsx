import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BackupPanel } from '../backup/BackupPanel'
import { ThemePicker } from '../settings/ThemePicker'

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
      <header className="pt-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Ajustes
        </h1>
        <p className="mt-1 text-muted">Temas, respaldo y preferencias.</p>
      </header>

      <div id="temas">
        <ThemePicker />
      </div>

      <BackupPanel />
    </div>
  )
}
