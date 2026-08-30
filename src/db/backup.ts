import { db } from './schema'
import type {
  BodyCheckIn,
  BodyPhotoAngle,
  ConstancyGoal,
  Improvement,
  Routine,
  TreadmillSession,
  WorkoutSession,
} from '../types'
import {
  getStoredBrandAvatarId,
  isBrandAvatarId,
  setStoredBrandAvatarId,
  type BrandAvatarId,
} from '../brand/avatars'
import { applyTheme, getStoredThemeId } from '../themes/applyTheme'
import { isThemeId, type ThemeId } from '../themes/presets'

export const BACKUP_VERSION = 5 as const
export const BACKUP_APP_ID = 'mi-gym'
export const LAST_BACKUP_STORAGE_KEY = 'mi-gym-last-backup-at'
export const BACKUP_REMINDER_DAYS = 3

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

export interface BackupPreferences {
  themeId: ThemeId
  brandAvatarId: BrandAvatarId
}

export interface MiGymBackup {
  version: 1 | 2 | 3 | 4 | 5
  app: typeof BACKUP_APP_ID
  exportedAt: number
  routines: Routine[]
  sessions: WorkoutSession[]
  improvements: Improvement[]
  exerciseImages: StoredExerciseImage[]
  bodyCheckIns?: BodyCheckIn[]
  bodyCheckInPhotos?: StoredBodyPhoto[]
  constancyGoals?: ConstancyGoal[]
  /** Preferencias de UI (tema + avatar). Desde v4. */
  preferences?: BackupPreferences
  /** Sesiones de caminadora. Desde v5. */
  treadmillSessions?: TreadmillSession[]
}

export function getLastBackupAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_STORAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function markBackupDone(at = Date.now()): void {
  try {
    localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(at))
  } catch {
    /* ignore */
  }
}

/** true si nunca respaldó o pasaron ≥ 3 días */
export function isBackupReminderDue(
  now = Date.now(),
  everyDays = BACKUP_REMINDER_DAYS,
): boolean {
  const last = getLastBackupAt()
  if (last == null) return true
  const ms = everyDays * 24 * 60 * 60 * 1000
  return now - last >= ms
}

export function daysSinceLastBackup(now = Date.now()): number | null {
  const last = getLastBackupAt()
  if (last == null) return null
  return Math.floor((now - last) / (24 * 60 * 60 * 1000))
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
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mimeType })
  } catch {
    throw new Error('Una imagen del respaldo está corrupta (base64 inválido).')
  }
}

function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Respaldo inválido: falta ${label}.`)
  }
  return value
}

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Respaldo inválido: ${label} no es un número.`)
  }
  return value
}

function assertUniqueIds(ids: string[], label: string): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`Respaldo inválido: hay ${label} duplicados (${id}).`)
    }
    seen.add(id)
  }
}

function validateRoutine(raw: unknown, index: number): Routine {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Respaldo inválido: rutina #${index + 1} mal formada.`)
  }
  const r = raw as Partial<Routine>
  assertNonEmptyString(r.id, `id de rutina #${index + 1}`)
  const name = assertNonEmptyString(r.name, `nombre de rutina #${index + 1}`)
  if (!Array.isArray(r.days)) {
    throw new Error(`Respaldo inválido: la rutina "${name}" no tiene días.`)
  }
  for (let i = 0; i < r.days.length; i++) {
    const day = r.days[i] as Partial<Routine['days'][number]>
    assertNonEmptyString(day?.id, `id del día #${i + 1} en "${name}"`)
    if (typeof day?.weekday !== 'number' || day.weekday < 0 || day.weekday > 6) {
      throw new Error(`Respaldo inválido: weekday inválido en "${name}".`)
    }
    if (!Array.isArray(day.exercises)) {
      throw new Error(`Respaldo inválido: ejercicios faltantes en un día de "${name}".`)
    }
  }
  return r as Routine
}

function validateSession(raw: unknown, index: number): WorkoutSession {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Respaldo inválido: sesión #${index + 1} mal formada.`)
  }
  const s = raw as Partial<WorkoutSession>
  assertNonEmptyString(s.id, `id de sesión #${index + 1}`)
  assertNonEmptyString(s.routineDayId, `routineDayId de sesión #${index + 1}`)
  assertNonEmptyString(s.date, `fecha de sesión #${index + 1}`)
  if (s.status !== 'in_progress' && s.status !== 'completed') {
    throw new Error(`Respaldo inválido: estado de sesión #${index + 1} desconocido.`)
  }
  if (!Array.isArray(s.exercises)) {
    throw new Error(`Respaldo inválido: sesión #${index + 1} sin ejercicios.`)
  }
  return s as WorkoutSession
}

function validateStoredImage(raw: unknown, index: number, label: string): void {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Respaldo inválido: ${label} #${index + 1} mal formada.`)
  }
  const img = raw as Partial<StoredExerciseImage>
  assertNonEmptyString(img.id, `id de ${label} #${index + 1}`)
  assertNonEmptyString(img.dataBase64, `datos de ${label} #${index + 1}`)
  assertNonEmptyString(img.mimeType, `mimeType de ${label} #${index + 1}`)
}

function validateConstancyGoal(raw: unknown, index: number): ConstancyGoal {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Respaldo inválido: meta #${index + 1} mal formada.`)
  }
  const g = raw as Partial<ConstancyGoal>
  assertNonEmptyString(g.id, `id de meta #${index + 1}`)
  assertNumber(g.targetCount, `targetCount de meta #${index + 1}`)
  assertNumber(g.currentCount, `currentCount de meta #${index + 1}`)
  if (g.status !== 'active' && g.status !== 'completed') {
    throw new Error(`Respaldo inválido: estado de meta #${index + 1} desconocido.`)
  }
  return g as ConstancyGoal
}

function parsePreferences(raw: unknown): BackupPreferences | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const p = raw as Partial<BackupPreferences>
  const themeId =
    typeof p.themeId === 'string' && isThemeId(p.themeId)
      ? p.themeId
      : undefined
  const brandAvatarId =
    typeof p.brandAvatarId === 'string' && isBrandAvatarId(p.brandAvatarId)
      ? p.brandAvatarId
      : undefined
  if (!themeId && !brandAvatarId) return undefined
  return {
    themeId: themeId ?? getStoredThemeId(),
    brandAvatarId: brandAvatarId ?? getStoredBrandAvatarId(),
  }
}

function validateTreadmillSession(raw: unknown, index: number): TreadmillSession {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Respaldo inválido: caminadora #${index + 1} mal formada.`)
  }
  const t = raw as Partial<TreadmillSession>
  assertNonEmptyString(t.id, `id de caminadora #${index + 1}`)
  assertNonEmptyString(t.date, `fecha de caminadora #${index + 1}`)
  assertNumber(t.createdAt, `createdAt de caminadora #${index + 1}`)
  assertNumber(t.speedMph, `speedMph de caminadora #${index + 1}`)
  assertNumber(t.inclinePercent, `inclinePercent de caminadora #${index + 1}`)
  assertNumber(t.durationMinutes, `durationMinutes de caminadora #${index + 1}`)
  assertNumber(t.durationSeconds, `durationSeconds de caminadora #${index + 1}`)
  assertNumber(t.calories, `calories de caminadora #${index + 1}`)
  return t as TreadmillSession
}

function parseBackup(raw: unknown): MiGymBackup {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Archivo inválido')
  }
  const data = raw as Partial<MiGymBackup>
  if (data.app !== BACKUP_APP_ID) {
    throw new Error('Este archivo no es un respaldo de Mi Gym')
  }
  if (
    data.version !== 1 &&
    data.version !== 2 &&
    data.version !== 3 &&
    data.version !== 4 &&
    data.version !== 5
  ) {
    throw new Error('Versión de respaldo no compatible')
  }
  if (!Array.isArray(data.routines) || !Array.isArray(data.sessions)) {
    throw new Error('El respaldo está incompleto (faltan rutinas o sesiones).')
  }

  const routines = data.routines.map((r, i) => validateRoutine(r, i))
  const sessions = data.sessions.map((s, i) => validateSession(s, i))
  const improvements = Array.isArray(data.improvements) ? data.improvements : []
  const exerciseImages = Array.isArray(data.exerciseImages) ? data.exerciseImages : []
  const bodyCheckIns = Array.isArray(data.bodyCheckIns) ? data.bodyCheckIns : []
  const bodyCheckInPhotos = Array.isArray(data.bodyCheckInPhotos)
    ? data.bodyCheckInPhotos
    : []
  const constancyGoals = Array.isArray(data.constancyGoals) ? data.constancyGoals : []
  const treadmillSessions = Array.isArray(data.treadmillSessions)
    ? data.treadmillSessions
    : []
  const preferences = parsePreferences(data.preferences)

  assertUniqueIds(
    routines.map((r) => r.id),
    'rutinas',
  )
  assertUniqueIds(
    sessions.map((s) => s.id),
    'sesiones',
  )

  exerciseImages.forEach((img, i) => validateStoredImage(img, i, 'imagen'))
  bodyCheckInPhotos.forEach((img, i) => validateStoredImage(img, i, 'foto corporal'))
  constancyGoals.forEach((g, i) => validateConstancyGoal(g, i))
  const validatedTreadmill = treadmillSessions.map((t, i) =>
    validateTreadmillSession(t, i),
  )

  if (constancyGoals.length > 0) {
    assertUniqueIds(
      constancyGoals.map((g) => g.id),
      'metas de constancia',
    )
  }

  if (validatedTreadmill.length > 0) {
    assertUniqueIds(
      validatedTreadmill.map((t) => t.id),
      'sesiones de caminadora',
    )
  }

  const inProgress = sessions.filter((s) => s.status === 'in_progress')
  if (inProgress.length > 1) {
    throw new Error(
      'Respaldo inválido: hay más de un entrenamiento en curso. Exporta de nuevo desde un dispositivo limpio.',
    )
  }

  return {
    version: data.version,
    app: BACKUP_APP_ID,
    exportedAt:
      typeof data.exportedAt === 'number' ? data.exportedAt : Date.now(),
    routines,
    sessions,
    improvements,
    exerciseImages,
    bodyCheckIns: bodyCheckIns as BodyCheckIn[],
    bodyCheckInPhotos,
    constancyGoals,
    preferences,
    treadmillSessions: validatedTreadmill,
  }
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
    treadmillSessions,
  ] = await Promise.all([
    db.routines.toArray(),
    db.sessions.toArray(),
    db.improvements.toArray(),
    db.exerciseImages.toArray(),
    db.bodyCheckIns.toArray(),
    db.bodyCheckInPhotos.toArray(),
    db.constancyGoals.toArray(),
    db.treadmillSessions.toArray(),
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
    treadmillSessions,
    preferences: {
      themeId: getStoredThemeId(),
      brandAvatarId: getStoredBrandAvatarId(),
    },
  }
}

export async function exportFullBackupJson(pretty = true): Promise<string> {
  const backup = await exportFullBackup()
  return JSON.stringify(backup, null, pretty ? 2 : 0)
}

/** Exporta, descarga mentalmente “hecho” y marca la fecha del último respaldo */
export async function exportAndMarkBackup(pretty = true): Promise<string> {
  const json = await exportFullBackupJson(pretty)
  markBackupDone()
  return json
}

export async function importFullBackup(raw: unknown): Promise<{
  routines: number
  sessions: number
  improvements: number
  images: number
  bodyCheckIns: number
  constancyGoals: number
  treadmillSessions: number
  restoredPreferences: boolean
}> {
  const backup = parseBackup(raw)

  let images: Array<{
    id: string
    blob: Blob
    mimeType: string
    updatedAt: number
  }>
  let bodyPhotos: Array<{
    id: string
    checkInId: string
    angle: BodyPhotoAngle
    blob: Blob
    mimeType: string
    updatedAt: number
  }>

  try {
    images = backup.exerciseImages.map((img) => ({
      id: img.id,
      blob: base64ToBlob(img.dataBase64, img.mimeType),
      mimeType: img.mimeType,
      updatedAt: img.updatedAt,
    }))
    bodyPhotos = (backup.bodyCheckInPhotos ?? []).map((img) => ({
      id: img.id,
      checkInId: img.checkInId,
      angle: img.angle,
      blob: base64ToBlob(img.dataBase64, img.mimeType),
      mimeType: img.mimeType,
      updatedAt: img.updatedAt,
    }))
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error('No se pudieron leer las imágenes del respaldo.')
  }

  try {
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
        db.treadmillSessions,
      ],
      async () => {
        await db.routines.clear()
        await db.sessions.clear()
        await db.improvements.clear()
        await db.exerciseImages.clear()
        await db.bodyCheckIns.clear()
        await db.bodyCheckInPhotos.clear()
        await db.constancyGoals.clear()
        await db.treadmillSessions.clear()

        if (backup.routines.length > 0) await db.routines.bulkAdd(backup.routines)
        if (backup.sessions.length > 0) await db.sessions.bulkAdd(backup.sessions)
        if (backup.improvements.length > 0) {
          await db.improvements.bulkAdd(backup.improvements)
        }
        if (images.length > 0) await db.exerciseImages.bulkAdd(images)
        if ((backup.bodyCheckIns?.length ?? 0) > 0) {
          await db.bodyCheckIns.bulkAdd(backup.bodyCheckIns!)
        }
        if (bodyPhotos.length > 0) await db.bodyCheckInPhotos.bulkAdd(bodyPhotos)
        if ((backup.constancyGoals?.length ?? 0) > 0) {
          await db.constancyGoals.bulkAdd(backup.constancyGoals!)
        }
        if ((backup.treadmillSessions?.length ?? 0) > 0) {
          await db.treadmillSessions.bulkAdd(backup.treadmillSessions!)
        }
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `No se pudo restaurar el respaldo. Tus datos anteriores pueden haberse borrado en este intento; importa de nuevo un respaldo válido. Detalle: ${msg}`,
    )
  }

  let restoredPreferences = false
  if (backup.preferences) {
    applyTheme(backup.preferences.themeId)
    setStoredBrandAvatarId(backup.preferences.brandAvatarId)
    restoredPreferences = true
  }

  markBackupDone(backup.exportedAt || Date.now())

  return {
    routines: backup.routines.length,
    sessions: backup.sessions.length,
    improvements: backup.improvements.length,
    images: images.length,
    bodyCheckIns: backup.bodyCheckIns?.length ?? 0,
    constancyGoals: backup.constancyGoals?.length ?? 0,
    treadmillSessions: backup.treadmillSessions?.length ?? 0,
    restoredPreferences,
  }
}

export function backupFilename(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `mi-gym-respaldo-${y}-${m}-${d}.json`
}
