import { db } from './schema'
import type {
  BodyCheckIn,
  BodyPhotoAngle,
  ConstancyGoal,
  Improvement,
  Routine,
  WorkoutSession,
} from '../types'

export const BACKUP_VERSION = 3 as const
export const BACKUP_APP_ID = 'mi-gym'

export interface StoredExerciseImage {
  id: string
  mimeType: string
  updatedAt: number
  dataBase64: string
}

export interface StoredBodyPhoto {
  id: string
  checkInId: string
  angle: BodyPhotoAngle
  mimeType: string
  updatedAt: number
  dataBase64: string
}

export interface MiGymBackup {
  version: 1 | 2 | 3
  app: typeof BACKUP_APP_ID
  exportedAt: number
  routines: Routine[]
  sessions: WorkoutSession[]
  improvements: Improvement[]
  exerciseImages: StoredExerciseImage[]
  bodyCheckIns?: BodyCheckIn[]
  bodyCheckInPhotos?: StoredBodyPhoto[]
  constancyGoals?: ConstancyGoal[]
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer la imagen'))
        return
      }
      const base64 = result.split(',')[1]
      if (!base64) {
        reject(new Error('Imagen inválida'))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Error al leer imagen'))
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function exportFullBackup(): Promise<MiGymBackup> {
  const [
    routines,
    sessions,
    improvements,
    images,
    bodyCheckIns,
    bodyPhotos,
    constancyGoals,
  ] = await Promise.all([
    db.routines.toArray(),
    db.sessions.toArray(),
    db.improvements.toArray(),
    db.exerciseImages.toArray(),
    db.bodyCheckIns.toArray(),
    db.bodyCheckInPhotos.toArray(),
    db.constancyGoals.toArray(),
  ])

  const exerciseImages: StoredExerciseImage[] = await Promise.all(
    images.map(async (img) => ({
      id: img.id,
      mimeType: img.mimeType,
      updatedAt: img.updatedAt,
      dataBase64: await blobToBase64(img.blob),
    })),
  )

  const bodyCheckInPhotos: StoredBodyPhoto[] = await Promise.all(
    bodyPhotos.map(async (img) => ({
      id: img.id,
      checkInId: img.checkInId,
      angle: img.angle,
      mimeType: img.mimeType,
      updatedAt: img.updatedAt,
      dataBase64: await blobToBase64(img.blob),
    })),
  )

  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP_ID,
    exportedAt: Date.now(),
    routines,
    sessions,
    improvements,
    exerciseImages,
    bodyCheckIns,
    bodyCheckInPhotos,
    constancyGoals,
  }
}

export async function exportFullBackupJson(pretty = true): Promise<string> {
  const backup = await exportFullBackup()
  return JSON.stringify(backup, null, pretty ? 2 : 0)
}

function parseBackup(raw: unknown): MiGymBackup {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Archivo inválido')
  }
  const data = raw as Partial<MiGymBackup>
  if (data.app !== BACKUP_APP_ID) {
    throw new Error('Este archivo no es un respaldo de Mi Gym')
  }
  if (data.version !== 1 && data.version !== 2 && data.version !== 3) {
    throw new Error('Versión de respaldo no compatible')
  }
  if (!Array.isArray(data.routines) || !Array.isArray(data.sessions)) {
    throw new Error('El respaldo está incompleto')
  }

  return {
    version: data.version,
    app: BACKUP_APP_ID,
    exportedAt: data.exportedAt ?? Date.now(),
    routines: data.routines,
    sessions: data.sessions ?? [],
    improvements: data.improvements ?? [],
    exerciseImages: data.exerciseImages ?? [],
    bodyCheckIns: data.bodyCheckIns ?? [],
    bodyCheckInPhotos: data.bodyCheckInPhotos ?? [],
    constancyGoals: data.constancyGoals ?? [],
  }
}

export async function importFullBackup(raw: unknown): Promise<{
  routines: number
  sessions: number
  improvements: number
  images: number
  bodyCheckIns: number
  constancyGoals: number
}> {
  const backup = parseBackup(raw)

  const images = backup.exerciseImages.map((img) => ({
    id: img.id,
    blob: base64ToBlob(img.dataBase64, img.mimeType),
    mimeType: img.mimeType,
    updatedAt: img.updatedAt,
  }))

  const bodyPhotos = (backup.bodyCheckInPhotos ?? []).map((img) => ({
    id: img.id,
    checkInId: img.checkInId,
    angle: img.angle,
    blob: base64ToBlob(img.dataBase64, img.mimeType),
    mimeType: img.mimeType,
    updatedAt: img.updatedAt,
  }))

  await db.transaction(
    'rw',
    [
      db.routines,
      db.sessions,
      db.improvements,
      db.exerciseImages,
      db.bodyCheckIns,
      db.bodyCheckInPhotos,
      db.constancyGoals,
    ],
    async () => {
      await db.routines.clear()
      await db.sessions.clear()
      await db.improvements.clear()
      await db.exerciseImages.clear()
      await db.bodyCheckIns.clear()
      await db.bodyCheckInPhotos.clear()
      await db.constancyGoals.clear()

      if (backup.routines.length > 0) await db.routines.bulkAdd(backup.routines)
      if (backup.sessions.length > 0) await db.sessions.bulkAdd(backup.sessions)
      if (backup.improvements.length > 0) await db.improvements.bulkAdd(backup.improvements)
      if (images.length > 0) await db.exerciseImages.bulkAdd(images)
      if ((backup.bodyCheckIns?.length ?? 0) > 0) {
        await db.bodyCheckIns.bulkAdd(backup.bodyCheckIns!)
      }
      if (bodyPhotos.length > 0) await db.bodyCheckInPhotos.bulkAdd(bodyPhotos)
      if ((backup.constancyGoals?.length ?? 0) > 0) {
        await db.constancyGoals.bulkAdd(backup.constancyGoals!)
      }
    },
  )

  return {
    routines: backup.routines.length,
    sessions: backup.sessions.length,
    improvements: backup.improvements.length,
    images: images.length,
    bodyCheckIns: backup.bodyCheckIns?.length ?? 0,
    constancyGoals: backup.constancyGoals?.length ?? 0,
  }
}

export function backupFilename(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `mi-gym-respaldo-${y}-${m}-${d}.json`
}
