import { db } from '../db/schema'
import { getSupabase } from '../lib/supabase'
import { downloadCloudToLocal } from './download'
import { uploadLocalToCloud, type SyncProgress } from './upload'

export type ReconcileAction = 'noop' | 'downloaded' | 'uploaded'

export interface ReconcileResult {
  action: ReconcileAction
  detail: string
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

/**
 * Al iniciar sesión: la cuenta manda.
 * - Nube con datos + local vacío (o distinto) → baja
 * - Nube vacía + local con datos → sube
 * - Igual → no hace nada
 */
export async function reconcileAccountOnLogin(
  userId: string,
  onProgress: SyncProgress = () => undefined,
): Promise<ReconcileResult> {
  onProgress('Sincronizando cuenta…')

  const [localRoutines, localSessions, cloud] = await Promise.all([
    db.routines.count(),
    db.sessions.count(),
    cloudCounts(userId),
  ])

  const localTotal = localRoutines + localSessions
  const cloudTotal = cloud.routines + cloud.sessions

  if (cloudTotal === 0 && localTotal === 0) {
    return { action: 'noop', detail: 'Cuenta vacía: aún no hay datos que sincronizar.' }
  }

  if (cloudTotal === 0 && localTotal > 0) {
    onProgress('Subiendo datos de este dispositivo a tu cuenta…')
    const stats = await uploadLocalToCloud(userId, onProgress)
    return {
      action: 'uploaded',
      detail: `Cuenta actualizada: ${stats.sessions} sesión(es), ${stats.routines} rutina(s).`,
    }
  }

  // Nube tiene datos
  if (
    localRoutines === cloud.routines &&
    localSessions === cloud.sessions &&
    localTotal > 0
  ) {
    return {
      action: 'noop',
      detail: 'Este dispositivo ya tiene los datos de tu cuenta.',
    }
  }

  onProgress('Cargando datos de tu cuenta…')
  const stats = await downloadCloudToLocal(userId, onProgress)
  return {
    action: 'downloaded',
    detail: `Listo: ${stats.sessions} sesión(es), ${stats.routines} rutina(s) de tu cuenta.`,
  }
}
