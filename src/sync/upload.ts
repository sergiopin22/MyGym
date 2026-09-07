import { getStoredBrandAvatarId } from '../brand/avatars'
import { getStoredAvatarMode } from '../brand/avatarMode'
import { CUSTOM_AVATAR_ID, getCustomAvatarRecord } from '../db/customAvatar'
import { db } from '../db/schema'
import { getSupabase } from '../lib/supabase'
import { getStoredThemeId } from '../themes/applyTheme'
import { getStoredFocusAccent, getStoredUiLayout } from '../ui/layoutMode'
import { msToIso } from './time'

export const LAST_CLOUD_UPLOAD_KEY = 'mi-gym-last-cloud-upload-at'

export type SyncProgress = (step: string) => void

const CHUNK = 80
const MEDIA_BUCKET = 'user-media'

export interface UploadStats {
  routines: number
  sessions: number
  goals: number
  treadmill: number
  improvements: number
  bodyCheckIns: number
  media: number
}

function markCloudUpload(at = Date.now()) {
  try {
    localStorage.setItem(LAST_CLOUD_UPLOAD_KEY, String(at))
  } catch {
    /* ignore */
  }
}

/** Deja que React pinte el mensaje de progreso (iPhone se traba con blobs). */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

async function report(onProgress: SyncProgress, step: string) {
  onProgress(step)
  await yieldToUi()
}

async function upsertChunk(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await sb.from(table).upsert(chunk, { onConflict })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

async function uploadBlob(path: string, blob: Blob, mimeType: string) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: mimeType || blob.type || 'application/octet-stream',
  })
  if (error) throw new Error(`Storage ${path}: ${error.message}`)
  return path
}

/**
 * Sube Dexie → Supabase. No borra datos locales.
 * Upsert: actualiza lo que ya existe en la nube.
 */
export async function uploadLocalToCloud(
  userId: string,
  onProgress: SyncProgress = () => undefined,
): Promise<UploadStats> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')

  // Texto primero (rápido). Medios después, uno a uno (no congelar el iPhone).
  await report(onProgress, 'Leyendo rutinas…')
  const routines = await db.routines.toArray()

  await report(onProgress, 'Leyendo historial…')
  const sessions = await db.sessions.toArray()

  await report(onProgress, 'Leyendo meta y caminadora…')
  const [goals, treadmill, improvements, bodyCheckIns] = await Promise.all([
    db.constancyGoals.toArray(),
    db.treadmillSessions.toArray(),
    db.improvements.toArray(),
    db.bodyCheckIns.toArray(),
  ])

  await report(onProgress, 'Subiendo rutinas…')
  await upsertChunk(
    'routines',
    routines.map((r) => ({
      id: r.id,
      user_id: userId,
      name: r.name,
      days: r.days,
      created_at: msToIso(r.createdAt)!,
      updated_at: msToIso(r.updatedAt)!,
    })),
    'user_id,id',
  )

  await report(onProgress, `Subiendo historial (${sessions.length})…`)
  await upsertChunk(
    'workout_sessions',
    sessions.map((s) => ({
      id: s.id,
      user_id: userId,
      routine_id: s.routineId,
      routine_day_id: s.routineDayId,
      day_label: s.dayLabel,
      muscle_groups: s.muscleGroups,
      date: s.date,
      status: s.status,
      started_at: msToIso(s.startedAt)!,
      finished_at: msToIso(s.finishedAt ?? null),
      duration_ms: s.durationMs ?? null,
      exercises: s.exercises,
      is_recovery: s.isRecovery ?? false,
      recovered_weekday: s.recoveredWeekday ?? null,
      recovered_day_label: s.recoveredDayLabel ?? null,
      edited_at: msToIso(s.editedAt ?? null),
      updated_at: new Date().toISOString(),
    })),
    'user_id,id',
  )

  await report(onProgress, 'Subiendo meta de constancia…')
  await upsertChunk(
    'constancy_goals',
    goals.map((g) => ({
      id: g.id,
      user_id: userId,
      target_count: g.targetCount,
      current_count: g.currentCount,
      prize_preset: g.prizePreset,
      prize_label: g.prizeLabel,
      status: g.status,
      created_at: msToIso(g.createdAt)!,
      updated_at: msToIso(g.updatedAt)!,
      completed_at: msToIso(g.completedAt ?? null),
      consecutive_misses: g.consecutiveMisses,
      last_evaluated_date: g.lastEvaluatedDate ?? null,
      recovery_week_key: g.recoveryWeekKey ?? null,
      reset_week_key: g.resetWeekKey ?? null,
      penance_week_key: g.penanceWeekKey ?? null,
      penance_label: g.penanceLabel ?? null,
    })),
    'user_id,id',
  )

  await report(onProgress, 'Subiendo caminadora…')
  await upsertChunk(
    'treadmill_sessions',
    treadmill.map((t) => ({
      id: t.id,
      user_id: userId,
      date: t.date,
      created_at: msToIso(t.createdAt)!,
      speed_mph: t.speedMph,
      incline_percent: t.inclinePercent,
      duration_minutes: t.durationMinutes,
      duration_seconds: t.durationSeconds,
      calories: t.calories,
      note: t.note ?? null,
    })),
    'user_id,id',
  )

  await report(onProgress, 'Subiendo mejoras…')
  await upsertChunk(
    'improvements',
    improvements.map((i) => ({
      id: i.id,
      user_id: userId,
      exercise_name: i.exerciseName,
      routine_exercise_id: i.routineExerciseId,
      session_id: i.sessionId,
      type: i.type,
      message: i.message,
      detected_at: msToIso(i.detectedAt)!,
      previous_best: i.previousBest ?? null,
      current_best: i.currentBest ?? null,
    })),
    'user_id,id',
  )

  await report(onProgress, 'Subiendo check-ins…')
  await upsertChunk(
    'body_check_ins',
    bodyCheckIns.map((b) => ({
      id: b.id,
      user_id: userId,
      date: b.date,
      created_at: msToIso(b.createdAt)!,
      weight_lb: b.weightLb,
      biceps_cm: b.bicepsCm,
      waist_cm: b.waistCm,
      chest_cm: b.chestCm,
      thigh_cm: b.thighCm,
      note: b.note ?? null,
    })),
    'user_id,id',
  )

  await report(onProgress, 'Subiendo preferencias…')
  {
    const { error } = await sb.from('user_preferences').upsert(
      {
        user_id: userId,
        theme_id: getStoredThemeId(),
        ui_layout: getStoredUiLayout(),
        focus_accent: getStoredFocusAccent(),
        brand_avatar_id: getStoredBrandAvatarId(),
        avatar_mode: getStoredAvatarMode(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) throw new Error(`preferencias: ${error.message}`)
  }

  let mediaCount = 0
  const mediaRows: Record<string, unknown>[] = []

  await report(onProgress, 'Subiendo avatar GIF…')
  const avatar = await getCustomAvatarRecord()
  if (avatar?.blob) {
    const path = `${userId}/avatar.gif`
    await uploadBlob(path, avatar.blob, avatar.mimeType)
    mediaRows.push({
      id: CUSTOM_AVATAR_ID,
      user_id: userId,
      kind: 'avatar_gif',
      storage_path: path,
      mime_type: avatar.mimeType,
      related_id: avatar.giphyId,
      angle: null,
      updated_at: msToIso(avatar.updatedAt)!,
    })
    mediaCount += 1
  }

  const exerciseImages = await db.exerciseImages.toArray()
  for (let i = 0; i < exerciseImages.length; i++) {
    const img = exerciseImages[i]
    await report(
      onProgress,
      `Subiendo imagen ejercicio ${i + 1}/${exerciseImages.length}…`,
    )
    const ext = img.mimeType.includes('png')
      ? 'png'
      : img.mimeType.includes('webp')
        ? 'webp'
        : 'jpg'
    const path = `${userId}/exercises/${img.id}.${ext}`
    await uploadBlob(path, img.blob, img.mimeType)
    mediaRows.push({
      id: `ex-${img.id}`,
      user_id: userId,
      kind: 'exercise_image',
      storage_path: path,
      mime_type: img.mimeType,
      related_id: img.id,
      angle: null,
      updated_at: msToIso(img.updatedAt)!,
    })
    mediaCount += 1
  }

  const bodyPhotos = await db.bodyCheckInPhotos.toArray()
  for (let i = 0; i < bodyPhotos.length; i++) {
    const photo = bodyPhotos[i]
    await report(
      onProgress,
      `Subiendo foto corporal ${i + 1}/${bodyPhotos.length}…`,
    )
    const ext = photo.mimeType.includes('png')
      ? 'png'
      : photo.mimeType.includes('webp')
        ? 'webp'
        : 'jpg'
    const path = `${userId}/body/${photo.checkInId}/${photo.angle}.${ext}`
    await uploadBlob(path, photo.blob, photo.mimeType)
    mediaRows.push({
      id: photo.id,
      user_id: userId,
      kind: 'body_photo',
      storage_path: path,
      mime_type: photo.mimeType,
      related_id: photo.checkInId,
      angle: photo.angle,
      updated_at: msToIso(photo.updatedAt)!,
    })
    mediaCount += 1
  }

  if (mediaRows.length > 0) {
    await report(onProgress, 'Guardando metadatos de medios…')
    await upsertChunk('media_assets', mediaRows, 'user_id,id')
  }

  markCloudUpload()
  await report(onProgress, 'Listo')

  return {
    routines: routines.length,
    sessions: sessions.length,
    goals: goals.length,
    treadmill: treadmill.length,
    improvements: improvements.length,
    bodyCheckIns: bodyCheckIns.length,
    media: mediaCount,
  }
}
