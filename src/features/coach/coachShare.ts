import {
  getAllExercisePRs,
  getCoachMachineHistory,
  listCoachMachines,
  type CoachMachineSession,
  type CoachMachineSummary,
  type ExercisePR,
} from '../../db/repository'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import { getStoredDisplayName } from '../../utils/displayName'
import { getStoredWeightUnit, type WeightUnit } from '../../utils/weight'
import { machineIdentityKey } from '../../utils/machineName'

export function isPublicCoachSharePath(pathname: string): boolean {
  return /^\/coach\/[^/]+\/?$/.test(pathname)
}

export interface CoachSharePayload {
  version: 1
  publishedAt: number
  unit: WeightUnit
  athleteName?: string
  machines: CoachMachineSummary[]
  prs: ExercisePR[]
  historyByMachine: Record<string, CoachMachineSession[]>
}

export interface CoachShareRecord {
  token: string
  publishedAt: number
  url: string
}

function foldName(value: string): string {
  return machineIdentityKey(value)
}

function createShareToken(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function historyKey(name: string): string {
  return foldName(name)
}

export function publicAppOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin.replace(/\/$/, '')
}

export function isLocalShareHost(origin = publicAppOrigin()): boolean {
  try {
    const host = new URL(origin).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return true
  }
}

export function coachShareUrl(token: string): string {
  return `${publicAppOrigin()}/coach/${token}`
}

export function coachShareWhatsAppText(url: string, athleteName?: string): string {
  const who = athleteName?.trim()
  if (who) {
    return `Hola, aquí está el historial de ${who} (máquinas y PRs, solo lectura):\n${url}`
  }
  return `Hola, aquí está el historial de mis máquinas y PRs (solo lectura):\n${url}`
}

export async function buildCoachSharePayload(
  userId?: string | null,
): Promise<CoachSharePayload> {
  const machines = await listCoachMachines()
  const prs = await getAllExercisePRs()
  const historyByMachine: Record<string, CoachMachineSession[]> = {}
  await Promise.all(
    machines.map(async (machine) => {
      historyByMachine[historyKey(machine.name)] =
        await getCoachMachineHistory(machine.name)
    }),
  )
  return {
    version: 1,
    publishedAt: Date.now(),
    unit: getStoredWeightUnit(userId),
    athleteName: getStoredDisplayName(userId) || undefined,
    machines,
    prs,
    historyByMachine,
  }
}

function mapShareRow(row: {
  token: string
  published_at?: string
}): CoachShareRecord {
  return {
    token: row.token,
    publishedAt: row.published_at
      ? new Date(row.published_at).getTime()
      : Date.now(),
    url: coachShareUrl(row.token),
  }
}

export async function getMyCoachShare(
  userId: string,
): Promise<CoachShareRecord | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('coach_shares')
    .select('token, published_at, revoked_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || data.revoked_at) return null
  return mapShareRow(data)
}

export async function publishCoachShare(
  userId: string,
  options?: { rotateToken?: boolean },
): Promise<CoachShareRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Para enviar el enlace inicia sesión en la nube (Ajustes).')
  }
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')

  const existing = await getMyCoachShare(userId)
  const token =
    options?.rotateToken || !existing ? createShareToken() : existing.token
  const payload = await buildCoachSharePayload(userId)
  const publishedAt = new Date().toISOString()

  const { error } = await sb.from('coach_shares').upsert(
    {
      user_id: userId,
      token,
      payload,
      published_at: publishedAt,
      revoked_at: null,
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    if (/coach_shares|schema cache|does not exist/i.test(error.message)) {
      throw new Error(
        'Falta crear la tabla del enlace coach. En Supabase → SQL Editor, ejecuta supabase/migrations/005_coach_shares.sql',
      )
    }
    throw new Error(error.message)
  }

  return {
    token,
    publishedAt: Date.now(),
    url: coachShareUrl(token),
  }
}

/** Actualiza el payload si ya hay un enlace activo (tras un sync). */
export async function refreshCoachShareIfActive(userId: string): Promise<void> {
  try {
    const existing = await getMyCoachShare(userId)
    if (!existing) return
    await publishCoachShare(userId, { rotateToken: false })
  } catch {
    /* no bloquear el sync */
  }
}

export async function revokeCoachShare(userId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no está configurado.')
  const { error } = await sb
    .from('coach_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function fetchCoachSharePayload(
  token: string,
): Promise<CoachSharePayload> {
  const sb = getSupabase()
  if (!sb) {
    throw new Error('Esta app no tiene nube configurada; el enlace no puede cargar.')
  }
  const { data, error } = await sb.rpc('get_coach_share', { p_token: token })
  if (error) {
    if (/get_coach_share|schema cache|does not exist/i.test(error.message)) {
      throw new Error(
        'El enlace coach aún no está activo en la nube. Hay que ejecutar la migración SQL.',
      )
    }
    throw new Error(error.message)
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Este enlace no existe o fue revocado.')
  }
  const payload = data as CoachSharePayload
  if (payload.version !== 1 || !Array.isArray(payload.machines)) {
    throw new Error('Este enlace no tiene datos válidos.')
  }
  return payload
}
