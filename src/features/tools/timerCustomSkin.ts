/** Meta de diseños de timer creados por el usuario (localStorage). */

export const TIMER_CUSTOM_SKINS_KEY = 'mi-gym-timer-custom-skins'
export const TIMER_CUSTOM_ACTIVE_KEY = 'mi-gym-timer-custom-active'
export const MAX_TIMER_CUSTOM_SKINS = 12

export type TimerCustomScene = 'clean' | 'war' | 'ring'
export type TimerCustomAnim =
  | 'none'
  | 'pulse'
  | 'combo'
  | 'glitch'
  | 'impact'
  | 'breathe'
  | 'shake'
export type TimerCustomLayout =
  | 'classic'
  | 'big'
  | 'bars'
  | 'poster'
  | 'boxing'
  | 'war'
  | 'minimal'
export type TimerCustomFont =
  | 'display'
  | 'soft'
  | 'mono'
  | 'impact'
  | 'rounded'
export type TimerCustomMediaPos = 'top' | 'watermark' | 'background' | 'hidden'
export type TimerCustomOverlay =
  | 'none'
  | 'vignette'
  | 'grain'
  | 'scan'
  | 'hazard'
  | 'mist'
  | 'tint'
export type TimerCustomBgMode = 'solid' | 'gradient'

export interface TimerCustomSkinMeta {
  id: string
  name: string
  accent: string
  accentSecondary: string
  title: string
  subtitle: string
  stamp: string
  doneText: string
  quotes: string[]
  scene: TimerCustomScene
  anim: TimerCustomAnim
  layout: TimerCustomLayout
  font: TimerCustomFont
  mediaPos: TimerCustomMediaPos
  bgMode: TimerCustomBgMode
  bgColor: string
  bgColor2: string
  overlay: TimerCustomOverlay
  overlayIntensity: number
  hasGif: boolean
  updatedAt: number
}

export const TIMER_ACCENT_PRESETS: Array<{
  id: string
  label: string
  color: string
}> = [
  { id: 'temach', label: 'Temach', color: '#e10600' },
  { id: 'ippo', label: 'Ippo', color: '#c41e3a' },
  { id: 'oxide', label: 'Óxido', color: '#ea580c' },
  { id: 'white', label: 'Blanco', color: '#ffffff' },
  { id: 'lime', label: 'Lima', color: '#a3e635' },
  { id: 'blue', label: 'Azul', color: '#38bdf8' },
  { id: 'gold', label: 'Oro', color: '#fbbf24' },
  { id: 'violet', label: 'Violeta', color: '#a78bfa' },
]

export const TIMER_SCENE_OPTIONS: Array<{
  id: TimerCustomScene
  label: string
  tagline: string
}> = [
  { id: 'clean', label: 'Clean', tagline: 'Sin FX de escena' },
  { id: 'war', label: 'War', tagline: 'Hazard + escombros' },
  { id: 'ring', label: 'Ring', tagline: 'Cuerdas de box' },
]

export const TIMER_ANIM_OPTIONS: Array<{
  id: TimerCustomAnim
  label: string
  tagline: string
}> = [
  { id: 'none', label: 'Nada', tagline: 'Sin animación' },
  { id: 'pulse', label: 'Pulso', tagline: 'Late el título' },
  { id: 'combo', label: 'Combo', tagline: 'Pulso + impacto + flash' },
  { id: 'glitch', label: 'Glitch', tagline: 'Ruido digital' },
  { id: 'impact', label: 'Impacto', tagline: 'Golpes en el media' },
  { id: 'breathe', label: 'Respira', tagline: 'Suave y lento' },
  { id: 'shake', label: 'Shake', tagline: 'Tiembla en final' },
]

export const TIMER_LAYOUT_OPTIONS: Array<{
  id: TimerCustomLayout
  label: string
  tagline: string
}> = [
  { id: 'classic', label: 'Classic', tagline: 'Anillo + dígitos' },
  { id: 'big', label: 'Big digits', tagline: 'Solo reloj enorme' },
  { id: 'bars', label: 'Bars', tagline: 'Barra de progreso' },
  { id: 'poster', label: 'Poster', tagline: 'Media grande arriba' },
  { id: 'boxing', label: 'Boxing', tagline: 'Cuerdas + round' },
  { id: 'war', label: 'War HUD', tagline: 'Stencil militar' },
  { id: 'minimal', label: 'Minimal', tagline: 'Casi solo el tiempo' },
]

export const TIMER_FONT_OPTIONS: Array<{
  id: TimerCustomFont
  label: string
  tagline: string
}> = [
  { id: 'display', label: 'Display', tagline: 'Space Grotesk' },
  { id: 'soft', label: 'Soft', tagline: 'Jakarta' },
  { id: 'mono', label: 'Mono', tagline: 'Plex Mono' },
  { id: 'impact', label: 'Impact', tagline: 'Bebas Neue' },
  { id: 'rounded', label: 'Rounded', tagline: 'Outfit' },
]

export const TIMER_MEDIA_POS_OPTIONS: Array<{
  id: TimerCustomMediaPos
  label: string
  tagline: string
}> = [
  { id: 'top', label: 'Arriba', tagline: 'Sobre el título' },
  { id: 'watermark', label: 'Marca agua', tagline: 'Fondo suave' },
  { id: 'background', label: 'Fondo full', tagline: 'Pantalla completa' },
  { id: 'hidden', label: 'Oculto', tagline: 'Sin media' },
]

export const TIMER_OVERLAY_OPTIONS: Array<{
  id: TimerCustomOverlay
  label: string
  tagline: string
}> = [
  { id: 'none', label: 'Ninguno', tagline: 'Sin capa extra' },
  { id: 'vignette', label: 'Vignette', tagline: 'Bordes oscuros' },
  { id: 'grain', label: 'Grain', tagline: 'Grano de film' },
  { id: 'scan', label: 'Scan', tagline: 'Líneas CRT' },
  { id: 'hazard', label: 'Hazard', tagline: 'Cinta peligro' },
  { id: 'mist', label: 'Niebla', tagline: 'Bruma suave' },
  { id: 'tint', label: 'Tint', tagline: 'Baño del acento' },
]

function clampIntensity(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return 55
  return Math.min(100, Math.max(0, Math.round(v)))
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

export function createEmptyCustomSkin(): TimerCustomSkinMeta {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `skin-${Date.now()}`
  return {
    id,
    name: 'Mi diseño',
    accent: '#e10600',
    accentSecondary: '#ffffff',
    title: 'MI ROUND',
    subtitle: 'PERSONAL',
    stamp: 'ROUND',
    doneText: 'GO',
    quotes: ['Disciplina > motivación', 'Un round más', 'Sigue adelante'],
    scene: 'clean',
    anim: 'combo',
    layout: 'classic',
    font: 'display',
    mediaPos: 'top',
    bgMode: 'solid',
    bgColor: '#050505',
    bgColor2: '#1a0505',
    overlay: 'vignette',
    overlayIntensity: 55,
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
    stamp: skin.stamp.trim() || 'ROUND',
    doneText: skin.doneText.trim() || 'GO',
    accent: isHexColor(skin.accent) ? skin.accent : '#e10600',
    accentSecondary: isHexColor(skin.accentSecondary)
      ? skin.accentSecondary
      : '#ffffff',
    bgColor: isHexColor(skin.bgColor) ? skin.bgColor : '#050505',
    bgColor2: isHexColor(skin.bgColor2) ? skin.bgColor2 : '#1a0505',
    overlayIntensity: clampIntensity(skin.overlayIntensity),
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
  if (phase === 'done') return quotes[0] ?? (skin.doneText || 'GO')
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
    row.anim === 'pulse' ||
    row.anim === 'none' ||
    row.anim === 'combo' ||
    row.anim === 'glitch' ||
    row.anim === 'impact' ||
    row.anim === 'breathe' ||
    row.anim === 'shake'
      ? row.anim
      : 'combo'
  const layout =
    row.layout === 'big' ||
    row.layout === 'bars' ||
    row.layout === 'poster' ||
    row.layout === 'boxing' ||
    row.layout === 'war' ||
    row.layout === 'minimal' ||
    row.layout === 'classic'
      ? row.layout
      : 'classic'
  const font =
    row.font === 'soft' ||
    row.font === 'mono' ||
    row.font === 'impact' ||
    row.font === 'rounded' ||
    row.font === 'display'
      ? row.font
      : 'display'
  const mediaPos =
    row.mediaPos === 'watermark' ||
    row.mediaPos === 'background' ||
    row.mediaPos === 'hidden' ||
    row.mediaPos === 'top'
      ? row.mediaPos
      : 'top'
  const overlay =
    row.overlay === 'grain' ||
    row.overlay === 'scan' ||
    row.overlay === 'hazard' ||
    row.overlay === 'mist' ||
    row.overlay === 'tint' ||
    row.overlay === 'none' ||
    row.overlay === 'vignette'
      ? row.overlay
      : 'vignette'
  const bgMode = row.bgMode === 'gradient' ? 'gradient' : 'solid'
  const quotes = Array.isArray(row.quotes)
    ? row.quotes.filter((q): q is string => typeof q === 'string')
    : []
  return {
    id: row.id,
    name: typeof row.name === 'string' ? row.name : 'Mi diseño',
    accent: isHexColor(row.accent) ? row.accent : '#e10600',
    accentSecondary: isHexColor(row.accentSecondary)
      ? row.accentSecondary
      : '#ffffff',
    title: typeof row.title === 'string' ? row.title : 'MI ROUND',
    subtitle: typeof row.subtitle === 'string' ? row.subtitle : '',
    stamp: typeof row.stamp === 'string' ? row.stamp : 'ROUND',
    doneText: typeof row.doneText === 'string' ? row.doneText : 'GO',
    quotes,
    scene,
    anim,
    layout,
    font,
    mediaPos,
    bgMode,
    bgColor: isHexColor(row.bgColor) ? row.bgColor : '#050505',
    bgColor2: isHexColor(row.bgColor2) ? row.bgColor2 : '#1a0505',
    overlay,
    overlayIntensity: clampIntensity(row.overlayIntensity),
    hasGif: Boolean(row.hasGif),
    updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
  }
}
