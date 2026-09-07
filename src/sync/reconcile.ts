import { db } from '../db/schema'
import { getSupabase } from '../lib/supabase'
import { downloadCloudToLocal } from './download'
import {
  LAST_CLOUD_UPLOAD_KEY,
  uploadLocalToCloud,
  type SyncProgress,
} from './upload'
import { pauseCloudAutoSync, resumeCloudAutoSync } from './autoSync'
import {
  clearLocalGymData,
  getLocalDataOwner,
  setLocalDataOwner,
} from './localDataOwner'
import {
  isWeightUnit,
  setStoredWeightUnit,
} from '../utils/weight'

export type ReconcileAction = 'noop' | 'downloaded' | 'uploaded' | 'cleared'

export interface ReconcileResult {
  action: ReconcileAction
  detail: string
  weightUnitApplied?: boolean
}

async function cloudCounts(userId: string): Promise<{
  routines: number
  sessions: number
}> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')

  const [routines, sessions] = await Promise.all([
    sb
      .from('routines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    sb
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  if (routines.error) throw new Error(routines.error.message)
  if (sessions.error) throw new Error(sessions.error.message)

  return {
    routines: routines.count ?? 0,
    sessions: sessions.count ?? 0,
  }
}

function deviceAlreadySyncedToSomeAccount(): boolean {
  try {
    return Boolean(localStorage.getItem(LAST_CLOUD_UPLOAD_KEY))
  } catch {
    return false
  }
}

/**
 * ¿Los datos locales son de otra cuenta?
 * - Dueño distinto → sí
 * - Sin dueño pero el dispositivo ya subió a la nube antes → sí
 *   (no regalar el historial a una cuenta nueva)
 */
function isForeignLocalData(userId: string, localTotal: number): boolean {
  if (localTotal <= 0) return false
  const owner = getLocalDataOwner()
  if (owner != null && owner !== userId) return true
  if (owner == null && deviceAlreadySyncedToSomeAccount()) return true
  return false
}

/** Siempre aplica weight_unit de la cuenta (lb/kg por usuario). */
export async function pullAccountWeightUnit(userId: string): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { data, error } = await sb
    .from('user_preferences')
    .select('weight_unit')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.weight_unit) return false
  if (!isWeightUnit(data.weight_unit)) return false
  setStoredWeightUnit(data.weight_unit, true, userId)
  return true
}

/**
 * Al iniciar sesión: la cuenta manda.
 * - Datos locales de OTRA cuenta → no se suben; se limpian o se reemplazan
 * - Nube con datos → baja
 * - Nube vacía + local de ESTA cuenta → sube
 * - Igual → noop
 */
export async function reconcileAccountOnLogin(
  userId: string,
  onProgress: SyncProgress = () => undefined,
): Promise<ReconcileResult> {
  pauseCloudAutoSync()
  try {
    return await reconcileAccountOnLoginInner(userId, onProgress)
  } finally {
    resumeCloudAutoSync()
  }
}

async function reconcileAccountOnLoginInner(
  userId: string,
  onProgress: SyncProgress,
): Promise<ReconcileResult> {
  onProgress('Sincronizando cuenta…')

  const weightUnitApplied = await pullAccountWeightUnit(userId)

  const [localRoutines, localSessions, cloud] = await Promise.all([
    db.routines.count(),
    db.sessions.count(),
    cloudCounts(userId),
  ])

  const localTotal = localRoutines + localSessions
  const cloudTotal = cloud.routines + cloud.sessions
  const foreignLocal = isForeignLocalData(userId, localTotal)

  // Otra cuenta dejó datos en el celular: no contaminar la cuenta nueva
  if (foreignLocal) {
    if (cloudTotal === 0) {
      onProgress('Cuenta nueva: limpiando datos de otra sesión…')
      await clearLocalGymData()
      setLocalDataOwner(userId)
      return {
        action: 'cleared',
        detail:
          'Cuenta vacía: se quitaron datos de otra cuenta en este dispositivo. Empiezas de cero.',
        weightUnitApplied,
      }
    }
    onProgress('Cargando datos de tu cuenta…')
    const stats = await downloadCloudToLocal(userId, onProgress)
    setLocalDataOwner(userId)
    return {
      action: 'downloaded',
      detail: `Listo: ${stats.sessions} sesión(es), ${stats.routines} rutina(s) de tu cuenta.`,
      weightUnitApplied: true,
    }
  }

  if (cloudTotal === 0 && localTotal === 0) {
    setLocalDataOwner(userId)
    return {
      action: 'noop',
      detail: 'Cuenta vacía: aún no hay datos que sincronizar.',
      weightUnitApplied,
    }
  }

  if (cloudTotal === 0 && localTotal > 0) {
    onProgress('Subiendo datos de este dispositivo a tu cuenta…')
    const stats = await uploadLocalToCloud(userId, onProgress)
    setLocalDataOwner(userId)
    return {
      action: 'uploaded',
      detail: `Cuenta actualizada: ${stats.sessions} sesión(es), ${stats.routines} rutina(s).`,
      weightUnitApplied,
    }
  }

  if (
    localRoutines === cloud.routines &&
    localSessions === cloud.sessions &&
    localTotal > 0
  ) {
    setLocalDataOwner(userId)
    return {
      action: 'noop',
      detail: 'Este dispositivo ya tiene los datos de tu cuenta.',
      weightUnitApplied,
    }
  }

  onProgress('Cargando datos de tu cuenta…')
  const stats = await downloadCloudToLocal(userId, onProgress)
  setLocalDataOwner(userId)
  return {
    action: 'downloaded',
    detail: `Listo: ${stats.sessions} sesión(es), ${stats.routines} rutina(s) de tu cuenta.`,
    weightUnitApplied: true,
  }
}
