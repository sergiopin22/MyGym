import { db } from '../db/schema'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadLocalToCloud } from './upload'

const DEFAULT_DELAY_MS = 4000
const MEDIA_DELAY_MS = 8000

let pauseCount = 0
let timer: number | null = null
let syncing = false
let pendingMedia = false
let hooksInstalled = false

export function pauseCloudAutoSync() {
  pauseCount += 1
  if (timer != null) {
    window.clearTimeout(timer)
    timer = null
  }
}

export function resumeCloudAutoSync() {
  pauseCount = Math.max(0, pauseCount - 1)
}

/**
 * Programa subida a la nube tras cambios locales.
 * Debounce: varios cambios → una sola subida.
 */
export function scheduleCloudSync(options?: {
  includeMedia?: boolean
  delayMs?: number
}) {
  if (!isSupabaseConfigured()) return
  if (typeof window === 'undefined') return
  if (pauseCount > 0) return

  if (options?.includeMedia) pendingMedia = true

  const delay =
    options?.delayMs ??
    (pendingMedia ? MEDIA_DELAY_MS : DEFAULT_DELAY_MS)

  if (timer != null) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    void runAutoSync()
  }, delay)
}

async function runAutoSync() {
  if (pauseCount > 0 || syncing) return
  if (!isSupabaseConfigured()) return

  const sb = getSupabase()
  if (!sb) return

  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session?.user) return

  const withMedia = pendingMedia
  pendingMedia = false
  syncing = true
  try {
    await uploadLocalToCloud(session.user.id, () => undefined, {
      includeMedia: withMedia,
    })
  } catch (err) {
    console.warn('[cloud auto-sync]', err)
    // Reintenta más tarde sin molestar
    scheduleCloudSync({
      includeMedia: withMedia,
      delayMs: 20_000,
    })
  } finally {
    syncing = false
  }
}

function onDataWrite() {
  scheduleCloudSync({ includeMedia: false })
}

function onMediaWrite() {
  scheduleCloudSync({ includeMedia: true })
}

/** Engancha Dexie: cualquier alta/cambio/borrado dispara sync. */
export function installCloudAutoSyncHooks() {
  if (hooksInstalled) return
  hooksInstalled = true

  const dataTables = [
    db.routines,
    db.sessions,
    db.constancyGoals,
    db.treadmillSessions,
    db.improvements,
    db.bodyCheckIns,
  ] as const

  for (const table of dataTables) {
    table.hook('creating', onDataWrite)
    table.hook('updating', onDataWrite)
    table.hook('deleting', onDataWrite)
  }

  const mediaTables = [
    db.exerciseImages,
    db.bodyCheckInPhotos,
    db.customAvatarGifs,
  ] as const

  for (const table of mediaTables) {
    table.hook('creating', onMediaWrite)
    table.hook('updating', onMediaWrite)
    table.hook('deleting', onMediaWrite)
  }
}
