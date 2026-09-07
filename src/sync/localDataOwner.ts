import { db } from '../db/schema'

const OWNER_KEY = 'mi-gym-local-data-owner'

/** Qué cuenta “posee” los datos de Dexie en este dispositivo. */
export function getLocalDataOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

export function setLocalDataOwner(userId: string): void {
  try {
    localStorage.setItem(OWNER_KEY, userId)
  } catch {
    /* ignore */
  }
}

export function clearLocalDataOwner(): void {
  try {
    localStorage.removeItem(OWNER_KEY)
  } catch {
    /* ignore */
  }
}

/** Borra rutinas, sesiones, fotos, etc. del dispositivo (no toca la nube). */
export async function clearLocalGymData(): Promise<void> {
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
      db.customAvatarGifs,
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
      await db.customAvatarGifs.clear()
    },
  )
}
