/** Meta de diseños de timer creados por el usuario (localStorage). */

export const TIMER_CUSTOM_SKINS_KEY = 'mi-gym-timer-custom-skins'
export const TIMER_CUSTOM_ACTIVE_KEY = 'mi-gym-timer-custom-active'
export const MAX_TIMER_CUSTOM_SKINS = 8

export type TimerCustomScene = 'clean' | 'war' | 'ring'
export type TimerCustomAnim = 'combo' | 'pulse' | 'none'

export interface TimerCustomSkinMeta {
  id: string
  name: string
  accent: string
  title: string
  subtitle: string
  quotes: string[]
  scene: TimerCustomScene
  anim: TimerCustomAnim
  hasGif: boolean
  updatedAt: number
}

export const TIMER_ACCENT_PRESETS: Array<{ id: string; label: string; color: string }> =
  [
    { id: 'temach', label: 'Temach', color: '#e10600' },
    { id: 'ippo', label: 'Ippo', color: '#c41e3a' },
    { id: 'oxide', label: 'Óxido', color: '#ea580c' },
    { id: 'white', label: 'Blanco', color: '#ffffff' },
    { id: 'lime', label: 'Lima', color: '#a3e635' },
    { id: 'blue', label: 'Azul', color: '#38bdf8' },
  ]

export const TIMER_SCENE_OPTIONS: Array<{
  id: TimerCustomScene
  label: string
  tagline: string
}> = [
  { id: 'clean', label: 'Clean', tagline: 'Negro limpio' },
  { id: 'war', label: 'War', tagline: 'Hazard + escombros' },
  { id: 'ring', label: 'Ring', tagline: 'Cuerdas de box' },
]

export const TIMER_ANIM_OPTIONS: Array<{
  id: TimerCustomAnim
  label: string
  tagline: string
}> = [
  { id: 'combo', label: 'Combo', tagline: 'Pulso + impacto + flash' },
  { id: 'pulse', label: 'Pulso', tagline: 'Solo late el título' },
  { id: 'none', label: 'Nada', tagline: 'Sin animación' },
]

export function createEmptyCustomSkin(): TimerCustomSkinMeta {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `skin-${Date.now()}`
  return {
    id,
    name: 'Mi diseño',
    accent: '#e10600',
    title: 'MI ROUND',
    subtitle: 'PERSONAL',
    quotes: ['Disciplina > motivación', 'Un round más', 'Sigue adelante'],
    scene: 'clean',
    anim: 'combo',
    hasGif: false,
    updatedAt: Date.now(),
  }
}

export function listCustomSkins(): TimerCustomSkinMeta[] {
  try {
    const raw = localStorage.getItem(TIMER_CUSTOM_SKINS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeSkin)
      .filter((s): s is TimerCustomSkinMeta => s != null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function getCustomSkin(id: string): TimerCustomSkinMeta | null {
  return listCustomSkins().find((s) => s.id === id) ?? null
}

export function getActiveCustomSkinId(): string | null {
  try {
    const id = localStorage.getItem(TIMER_CUSTOM_ACTIVE_KEY)
    if (!id) return null
    return getCustomSkin(id) ? id : null
  } catch {
    return null
  }
}

/** Skin activo o el más reciente; null si no hay ninguno. */
export function getActiveCustomSkin(): TimerCustomSkinMeta | null {
  const id = getActiveCustomSkinId()
  if (id) return getCustomSkin(id)
  return listCustomSkins()[0] ?? null
}

export function setActiveCustomSkinId(id: string | null): void {
  try {
    if (!id) localStorage.removeItem(TIMER_CUSTOM_ACTIVE_KEY)
    else localStorage.setItem(TIMER_CUSTOM_ACTIVE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function upsertCustomSkin(skin: TimerCustomSkinMeta): TimerCustomSkinMeta {
  const next: TimerCustomSkinMeta = {
    ...skin,
    name: skin.name.trim() || 'Mi diseño',
    title: skin.title.trim() || 'MI ROUND',
    subtitle: skin.subtitle.trim(),
    quotes: skin.quotes.map((q) => q.trim()).filter(Boolean).slice(0, 12),
    updatedAt: Date.now(),
  }
  const all = listCustomSkins().filter((s) => s.id !== next.id)
  all.unshift(next)
  const capped = all.slice(0, MAX_TIMER_CUSTOM_SKINS)
  try {
    localStorage.setItem(TIMER_CUSTOM_SKINS_KEY, JSON.stringify(capped))
  } catch {
    /* ignore */
  }
  return next
}

export function deleteCustomSkinMeta(id: string): void {
  const next = listCustomSkins().filter((s) => s.id !== id)
  try {
    localStorage.setItem(TIMER_CUSTOM_SKINS_KEY, JSON.stringify(next))
    if (getActiveCustomSkinId() === id) setActiveCustomSkinId(null)
  } catch {
    /* ignore */
  }
}

export function customSkinQuote(
  skin: TimerCustomSkinMeta,
  elapsedSec: number,
  phase: 'running' | 'done',
  final: boolean,
): string {
  const quotes = skin.quotes.length
    ? skin.quotes
    : ['Sigue adelante', 'Un round más']
  if (phase === 'done') return quotes[0] ?? 'GO'
  if (final) return quotes[Math.min(1, quotes.length - 1)] ?? quotes[0]
  const idx = Math.floor(Math.max(0, elapsedSec) / 8) % quotes.length
  return quotes[idx] ?? quotes[0]
}

function normalizeSkin(raw: unknown): TimerCustomSkinMeta | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.id !== 'string' || !row.id) return null
  const scene =
    row.scene === 'war' || row.scene === 'ring' || row.scene === 'clean'
      ? row.scene
      : 'clean'
  const anim =
    row.anim === 'pulse' || row.anim === 'none' || row.anim === 'combo'
      ? row.anim
      : 'combo'
  const quotes = Array.isArray(row.quotes)
    ? row.quotes.filter((q): q is string => typeof q === 'string')
    : []
  return {
    id: row.id,
    name: typeof row.name === 'string' ? row.name : 'Mi diseño',
    accent: typeof row.accent === 'string' ? row.accent : '#e10600',
    title: typeof row.title === 'string' ? row.title : 'MI ROUND',
    subtitle: typeof row.subtitle === 'string' ? row.subtitle : '',
    quotes,
    scene,
    anim,
    hasGif: Boolean(row.hasGif),
    updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
  }
}
