import { setStoredBrandAvatarId, isBrandAvatarId } from '../brand/avatars'
import { setStoredAvatarMode, isAvatarMode } from '../brand/avatarMode'
import { CUSTOM_AVATAR_ID } from '../db/customAvatar'
import { db } from '../db/schema'
import { getSupabase } from '../lib/supabase'
import { applyTheme } from '../themes/applyTheme'
import { isThemeId } from '../themes/presets'
import { applyUiLayout } from '../ui/applyUiLayout'
import {
  isFocusAccentId,
  isUiLayoutId,
  type FocusAccentId,
  type UiLayoutId,
} from '../ui/layoutMode'
import type {
  BodyCheckIn,
  BodyCheckInPhoto,
  BodyPhotoAngle,
  ConstancyGoal,
  ExerciseImage,
  Improvement,
  Routine,
  TreadmillSession,
  WorkoutSession,
} from '../types'
import type { SyncProgress } from './upload'
import { isoToMs, isoToMsRequired } from './time'
import { pauseCloudAutoSync, resumeCloudAutoSync } from './autoSync'

const MEDIA_BUCKET = 'user-media'

export interface DownloadStats {
  routines: number
  sessions: number
  goals: number
  treadmill: number
  improvements: number
  bodyCheckIns: number
  media: number
  restoredPreferences: boolean
}

async function fetchAll<T>(table: string, userId: string): Promise<T[]> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')
  const { data, error } = await sb.from(table).select('*').eq('user_id', userId)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}

async function downloadBlob(path: string): Promise<Blob> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')
  const { data, error } = await sb.storage.from(MEDIA_BUCKET).download(path)
  if (error || !data) throw new Error(`Storage ${path}: ${error?.message ?? 'sin datos'}`)
  return data
}

type CloudRoutine = {
  id: string
  name: string
  days: Routine['days']
  created_at: string
  updated_at: string
}

type CloudSession = {
  id: string
  routine_id: string
  routine_day_id: string
  day_label: string
  muscle_groups: string[]
  date: string
  status: WorkoutSession['status']
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  exercises: WorkoutSession['exercises']
  is_recovery: boolean | null
  recovered_weekday: number | null
  recovered_day_label: string | null
  edited_at: string | null
}

type CloudGoal = {
  id: string
  target_count: number
  current_count: number
  prize_preset: ConstancyGoal['prizePreset']
  prize_label: string
  status: ConstancyGoal['status']
  created_at: string
  updated_at: string
  completed_at: string | null
  consecutive_misses: number
  last_evaluated_date: string | null
  recovery_week_key: string | null
  reset_week_key: string | null
  penance_week_key: string | null
  penance_label: string | null
}

type CloudTreadmill = {
  id: string
  date: string
  created_at: string
  speed_mph: number
  incline_percent: number
  duration_minutes: number
  duration_seconds: number
  calories: number
  note: string | null
}

type CloudImprovement = {
  id: string
  exercise_name: string
  routine_exercise_id: string
  session_id: string
  type: Improvement['type']
  message: string
  detected_at: string
  previous_best: Improvement['previousBest'] | null
  current_best: Improvement['currentBest'] | null
}

type CloudBody = {
  id: string
  date: string
  created_at: string
  weight_lb: number
  biceps_cm: number
  waist_cm: number
  chest_cm: number
  thigh_cm: number
  note: string | null
}

type CloudMedia = {
  id: string
  kind: 'avatar_gif' | 'exercise_image' | 'body_photo'
  storage_path: string
  mime_type: string
  related_id: string | null
  angle: string | null
  updated_at: string
}

type CloudPrefs = {
  theme_id: string | null
  ui_layout: string | null
  focus_accent: string | null
  brand_avatar_id: string | null
  avatar_mode: string | null
}

/**
 * Baja nube → Dexie. Reemplaza tablas locales (tras confirmación en UI).
 * No toca la nube.
 */
export async function downloadCloudToLocal(
  userId: string,
  onProgress: SyncProgress = () => undefined,
): Promise<DownloadStats> {
  pauseCloudAutoSync()
  try {
    return await downloadCloudToLocalInner(userId, onProgress)
  } finally {
    resumeCloudAutoSync()
  }
}

async function downloadCloudToLocalInner(
  userId: string,
  onProgress: SyncProgress,
): Promise<DownloadStats> {
  onProgress('Descargando desde la nube…')

  const [
    cloudRoutines,
    cloudSessions,
    cloudGoals,
    cloudTreadmill,
    cloudImprovements,
    cloudBody,
    cloudMedia,
    cloudPrefsRows,
  ] = await Promise.all([
    fetchAll<CloudRoutine>('routines', userId),
    fetchAll<CloudSession>('workout_sessions', userId),
    fetchAll<CloudGoal>('constancy_goals', userId),
    fetchAll<CloudTreadmill>('treadmill_sessions', userId),
    fetchAll<CloudImprovement>('improvements', userId),
    fetchAll<CloudBody>('body_check_ins', userId),
    fetchAll<CloudMedia>('media_assets', userId),
    fetchAll<CloudPrefs>('user_preferences', userId),
  ])

  const routines: Routine[] = cloudRoutines.map((r) => ({
    id: r.id,
    name: r.name,
    days: r.days ?? [],
    createdAt: isoToMsRequired(r.created_at),
    updatedAt: isoToMsRequired(r.updated_at),
  }))

  const sessions: WorkoutSession[] = cloudSessions.map((s) => ({
    id: s.id,
    routineId: s.routine_id,
    routineDayId: s.routine_day_id,
    dayLabel: s.day_label,
    muscleGroups: s.muscle_groups ?? [],
    date: s.date,
    status: s.status,
    startedAt: isoToMsRequired(s.started_at),
    finishedAt: isoToMs(s.finished_at) ?? undefined,
    durationMs: s.duration_ms ?? undefined,
    exercises: s.exercises ?? [],
    isRecovery: s.is_recovery ?? undefined,
    recoveredWeekday:
      s.recovered_weekday === 0 ||
      s.recovered_weekday === 1 ||
      s.recovered_weekday === 2 ||
      s.recovered_weekday === 3 ||
      s.recovered_weekday === 4 ||
      s.recovered_weekday === 5 ||
      s.recovered_weekday === 6
        ? s.recovered_weekday
        : undefined,
    recoveredDayLabel: s.recovered_day_label ?? undefined,
    editedAt: isoToMs(s.edited_at) ?? undefined,
  }))

  const goals: ConstancyGoal[] = cloudGoals.map((g) => ({
    id: g.id,
    targetCount: g.target_count,
    currentCount: g.current_count,
    prizePreset: g.prize_preset,
    prizeLabel: g.prize_label,
    status: g.status,
    createdAt: isoToMsRequired(g.created_at),
    updatedAt: isoToMsRequired(g.updated_at),
    completedAt: isoToMs(g.completed_at) ?? undefined,
    consecutiveMisses: g.consecutive_misses ?? 0,
    lastEvaluatedDate: g.last_evaluated_date ?? undefined,
    recoveryWeekKey: g.recovery_week_key ?? undefined,
    resetWeekKey: g.reset_week_key ?? undefined,
    penanceWeekKey: g.penance_week_key ?? undefined,
    penanceLabel: g.penance_label ?? undefined,
  }))

  const treadmill: TreadmillSession[] = cloudTreadmill.map((t) => ({
    id: t.id,
    date: t.date,
    createdAt: isoToMsRequired(t.created_at),
    speedMph: t.speed_mph,
    inclinePercent: t.incline_percent,
    durationMinutes: t.duration_minutes,
    durationSeconds: t.duration_seconds,
    calories: t.calories,
    note: t.note ?? undefined,
  }))

  const improvements: Improvement[] = cloudImprovements.map((i) => ({
    id: i.id,
    exerciseName: i.exercise_name,
    routineExerciseId: i.routine_exercise_id,
    sessionId: i.session_id,
    type: i.type,
    message: i.message,
    detectedAt: isoToMsRequired(i.detected_at),
    previousBest: i.previous_best ?? undefined,
    currentBest: i.current_best ?? undefined,
  }))

  const bodyCheckIns: BodyCheckIn[] = cloudBody.map((b) => ({
    id: b.id,
    date: b.date,
    createdAt: isoToMsRequired(b.created_at),
    weightLb: b.weight_lb,
    bicepsCm: b.biceps_cm,
    waistCm: b.waist_cm,
    chestCm: b.chest_cm,
    thighCm: b.thigh_cm,
    note: b.note ?? undefined,
  }))

  onProgress('Descargando medios…')
  const exerciseImages: ExerciseImage[] = []
  const bodyPhotos: BodyCheckInPhoto[] = []
  let avatarRecord: {
    id: typeof CUSTOM_AVATAR_ID
    giphyId: string
    title: string
    blob: Blob
    mimeType: string
    updatedAt: number
  } | null = null

  for (const m of cloudMedia) {
    const blob = await downloadBlob(m.storage_path)
    const updatedAt = isoToMsRequired(m.updated_at)
    if (m.kind === 'avatar_gif') {
      avatarRecord = {
        id: CUSTOM_AVATAR_ID,
        giphyId: m.related_id ?? 'cloud',
        title: 'Avatar nube',
        blob,
        mimeType: m.mime_type,
        updatedAt,
      }
    } else if (m.kind === 'exercise_image' && m.related_id) {
      exerciseImages.push({
        id: m.related_id,
        blob,
        mimeType: m.mime_type,
        updatedAt,
      })
    } else if (m.kind === 'body_photo' && m.related_id && m.angle) {
      bodyPhotos.push({
        id: m.id,
        checkInId: m.related_id,
        angle: m.angle as BodyPhotoAngle,
        blob,
        mimeType: m.mime_type,
        updatedAt,
      })
    }
  }

  onProgress('Reemplazando datos locales…')
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

      if (routines.length) await db.routines.bulkAdd(routines)
      if (sessions.length) await db.sessions.bulkAdd(sessions)
      if (improvements.length) await db.improvements.bulkAdd(improvements)
      if (exerciseImages.length) await db.exerciseImages.bulkAdd(exerciseImages)
      if (bodyCheckIns.length) await db.bodyCheckIns.bulkAdd(bodyCheckIns)
      if (bodyPhotos.length) await db.bodyCheckInPhotos.bulkAdd(bodyPhotos)
      if (goals.length) await db.constancyGoals.bulkAdd(goals)
      if (treadmill.length) await db.treadmillSessions.bulkAdd(treadmill)
      if (avatarRecord) await db.customAvatarGifs.put(avatarRecord)
    },
  )

  let restoredPreferences = false
  const prefs = cloudPrefsRows[0]
  if (prefs) {
    if (prefs.theme_id && isThemeId(prefs.theme_id)) {
      applyTheme(prefs.theme_id)
      restoredPreferences = true
    }
    const layout: UiLayoutId | undefined =
      prefs.ui_layout && isUiLayoutId(prefs.ui_layout)
        ? prefs.ui_layout
        : undefined
    const accent: FocusAccentId | undefined =
      prefs.focus_accent && isFocusAccentId(prefs.focus_accent)
        ? prefs.focus_accent
        : undefined
    if (layout) {
      applyUiLayout(layout, accent)
      restoredPreferences = true
    }
    if (prefs.brand_avatar_id && isBrandAvatarId(prefs.brand_avatar_id)) {
      setStoredBrandAvatarId(prefs.brand_avatar_id)
      restoredPreferences = true
    }
    if (prefs.avatar_mode && isAvatarMode(prefs.avatar_mode)) {
      setStoredAvatarMode(prefs.avatar_mode)
      restoredPreferences = true
    }
  }

  onProgress('Listo')
  return {
    routines: routines.length,
    sessions: sessions.length,
    goals: goals.length,
    treadmill: treadmill.length,
    improvements: improvements.length,
    bodyCheckIns: bodyCheckIns.length,
    media: cloudMedia.length,
    restoredPreferences,
  }
}
