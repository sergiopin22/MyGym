import { useState } from 'react'
import { Button } from '../../components/Button'
import {
  BACKUP_REMINDER_NUDGE_DAYS,
  BACKUP_REMINDER_WEEKLY_DAYS,
  backupFilename,
  daysSinceLastBackup,
  exportAndMarkBackup,
  getLastBackupAt,
  isBackupReminderDue,
  snoozeBackupReminder,
} from '../../db/backup'
import { downloadTextFile } from '../../utils/clipboard'

export function BackupReminderCard() {
  const [visible, setVisible] = useState(() => isBackupReminderDue())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!visible) return null

  const last = getLastBackupAt()
  const days = daysSinceLastBackup()
  const subtitle =
    last == null
      ? `Aún no has descargado un respaldo. Si lo dejas para después, te lo recordamos cada ${BACKUP_REMINDER_NUDGE_DAYS} días.`
      : `Han pasado ${days ?? BACKUP_REMINDER_WEEKLY_DAYS}+ días. Ideal: al menos cada ${BACKUP_REMINDER_WEEKLY_DAYS} días. Incluye rutina, historial, PRs, meta, tema y avatar.`

  async function handleDownload() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const json = await exportAndMarkBackup(true)
      downloadTextFile(backupFilename(), json)
      setMessage(
        `Respaldo listo. El próximo aviso será en ${BACKUP_REMINDER_WEEKLY_DAYS} días. Guárdalo en Drive, iCloud o correo.`,
      )
      window.setTimeout(() => setVisible(false), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar')
    } finally {
      setSaving(false)
    }
  }

  function handleSnooze() {
    snoozeBackupReminder()
    setVisible(false)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-brand-soft p-4 ring-1 ring-brand/30">
      <div>
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          Protege tus datos
        </p>
        <h2 className="mt-1 font-display text-lg font-extrabold text-fg">
          Respaldo semanal
        </h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      <Button fullWidth disabled={saving} onClick={() => void handleDownload()}>
        {saving ? 'Preparando…' : 'Descargar respaldo ahora'}
      </Button>

      <button
        type="button"
        className="w-full text-center text-xs font-semibold text-muted underline"
        onClick={handleSnooze}
      >
        Ahora no (recordar en {BACKUP_REMINDER_NUDGE_DAYS} días)
      </button>

      {message ? (
        <p className="text-sm font-medium text-accent-strong">{message}</p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  )
}
