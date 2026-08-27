import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import {
  backupFilename,
  exportFullBackupJson,
  importFullBackup,
} from '../../db/backup'
import { copyToClipboard, downloadTextFile } from '../../utils/clipboard'

export function BackupPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    setMessage(null)
    try {
      const json = await exportFullBackupJson()
      downloadTextFile(backupFilename(), json)
      setMessage(
        'Respaldo descargado. Guárdalo en iCloud, Drive o envíatelo por correo.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportCopy() {
    setExporting(true)
    setError(null)
    setMessage(null)
    try {
      const json = await exportFullBackupJson(false)
      await copyToClipboard(json)
      setMessage('Respaldo copiado al portapapeles. Pégalo en Notas o envíalo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return

    const ok = window.confirm(
      'Importar respaldo reemplazará tu rutina, historial y progreso actual en este dispositivo.\n\n¿Continuar?',
    )
    if (!ok) return

    setImporting(true)
    setError(null)
    setMessage(null)

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const stats = await importFullBackup(parsed)
      setMessage(
        `Respaldo restaurado: ${stats.routines} rutina(s), ${stats.sessions} sesión(es), ${stats.constancyGoals} meta(s), ${stats.images} imagen(es).`,
      )
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Respaldo y recuperación</h2>
        <p className="mt-1 text-sm text-muted">
          Exporta rutina, historial, progreso y fotos. Si cambias de celular o
          borras datos, importa el archivo para recuperar todo.
        </p>
      </div>

      <Button fullWidth disabled={exporting} onClick={() => void handleExport()}>
        {exporting ? 'Exportando…' : 'Exportar respaldo completo'}
      </Button>

      <Button
        variant="secondary"
        fullWidth
        disabled={exporting}
        onClick={() => void handleExportCopy()}
      >
        Copiar respaldo al portapapeles
      </Button>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleImportFile(e.target.files?.[0])}
        />
        <Button
          variant="ghost"
          fullWidth
          disabled={importing}
          onClick={() => fileRef.current?.click()}
        >
          {importing ? 'Importando…' : 'Importar respaldo'}
        </Button>
      </div>

      {message ? (
        <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm font-medium text-accent-strong">
          {message}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </Card>
  )
}
