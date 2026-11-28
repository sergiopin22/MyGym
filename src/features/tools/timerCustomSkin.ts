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

/** Combos curados: un toque y ya combina bien. */
export type TimerThemePackId =
  | 'guerra'
  | 'ring'
  | 'oxido'
  | 'neon'
  | 'cyber'
  | 'oro'
  | 'anime'
  | 'clean'

export interface TimerThemePack {
  id: TimerThemePackId
  label: string
  tagline: string
  swatches: [string, string, string]
  patch: Omit<
    TimerCustomSkinMeta,
    'id' | 'hasGif' | 'updatedAt' | 'name'
  > & { name?: string }
}

export const TIMER_THEME_PACKS: TimerThemePack[] = [
  {
    id: 'guerra',
    label: 'Guerra',
    tagline: 'Rojo Temach · HUD · combo',
    swatches: ['#e10600', '#050505', '#ffffff'],
    patch: {
      name: 'Modo Guerra',
      accent: '#e10600',
      accentSecondary: '#ffffff',
      title: 'MODO GUERRA',
      subtitle: 'EJÉRCITO DE LOS COMPAS',
      stamp: 'ROUND',
      doneText: 'GO',
      quotes: [
        'Disciplina > motivación',
        'Exhausto y victorioso',
        'Un round más',
      ],
      scene: 'war',
      anim: 'combo',
      layout: 'war',
      font: 'impact',
      mediaPos: 'top',
      bgMode: 'gradient',
      bgColor: '#0a0000',
      bgColor2: '#1a0505',
      overlay: 'hazard',
      overlayIntensity: 45,
    },
  },
  {
    id: 'ring',
    label: 'Ring',
    tagline: 'Box · cuerdas · impacto',
    swatches: ['#c41e3a', '#080808', '#f8fafc'],
    patch: {
      name: 'Ring',
      accent: '#c41e3a',
      accentSecondary: '#f8fafc',
      title: 'IPPO',
      subtitle: 'KAMOGAWA BOXING GYM',
      stamp: 'ROUND',
      doneText: 'BELL',
      quotes: ['El espíritu de lucha', 'Último round', 'Nunca te rindas'],
      scene: 'ring',
      anim: 'impact',
      layout: 'boxing',
      font: 'display',
      mediaPos: 'top',
      bgMode: 'solid',
      bgColor: '#070707',
      bgColor2: '#1a0a0a',
      overlay: 'vignette',
      overlayIntensity: 60,
    },
  },
  {
    id: 'oxido',
    label: 'Óxido',
    tagline: 'Gym dark · clássico · pulse',
    swatches: ['#ea580c', '#0a0908', '#ffedd5'],
    patch: {
      name: 'Óxido',
      accent: '#ea580c',
      accentSecondary: '#ffedd5',
      title: 'FOCUS',
      subtitle: 'MI GYM',
      stamp: 'WORK',
      doneText: 'GO',
      quotes: ['Una serie más', 'Constancia', 'Hoy toca'],
      scene: 'clean',
      anim: 'pulse',
      layout: 'classic',
      font: 'display',
      mediaPos: 'top',
      bgMode: 'gradient',
      bgColor: '#0a0908',
      bgColor2: '#1c120a',
      overlay: 'grain',
      overlayIntensity: 40,
    },
  },
  {
    id: 'neon',
    label: 'Neón',
    tagline: 'Lima · dígitos grandes · breathe',
    swatches: ['#a3e635', '#030712', '#ecfccb'],
    patch: {
      name: 'Neón',
      accent: '#a3e635',
      accentSecondary: '#ecfccb',
      title: 'CHARGE',
      subtitle: 'ENERGY',
      stamp: 'LIVE',
      doneText: 'GO',
      quotes: ['Sigue el ritmo', 'Carga completa', 'Otro round'],
      scene: 'clean',
      anim: 'breathe',
      layout: 'big',
      font: 'rounded',
      mediaPos: 'watermark',
      bgMode: 'solid',
      bgColor: '#030712',
      bgColor2: '#052e16',
      overlay: 'tint',
      overlayIntensity: 25,
    },
  },
  {
    id: 'cyber',
    label: 'Cyber',
    tagline: 'Azul · barras · glitch',
    swatches: ['#38bdf8', '#020617', '#e0f2fe'],
    patch: {
      name: 'Cyber',
      accent: '#38bdf8',
      accentSecondary: '#e0f2fe',
      title: 'SYSTEM',
      subtitle: 'ONLINE',
      stamp: 'SYNC',
      doneText: 'OK',
      quotes: ['Procesando…', 'Casi listo', 'Ejecutar'],
      scene: 'clean',
      anim: 'glitch',
      layout: 'bars',
      font: 'mono',
      mediaPos: 'hidden',
      bgMode: 'gradient',
      bgColor: '#020617',
      bgColor2: '#0c4a6e',
      overlay: 'scan',
      overlayIntensity: 50,
    },
  },
  {
    id: 'oro',
    label: 'Oro',
    tagline: 'Minimal · elegante · sin ruido',
    swatches: ['#fbbf24', '#09090b', '#fef3c7'],
    patch: {
      name: 'Oro',
      accent: '#fbbf24',
      accentSecondary: '#fef3c7',
      title: 'LEGACY',
      subtitle: 'ELITE',
      stamp: 'PR',
      doneText: 'GO',
      quotes: ['Calma y fuerza', 'Precisión', 'Dominio'],
      scene: 'clean',
      anim: 'none',
      layout: 'minimal',
      font: 'soft',
      mediaPos: 'hidden',
      bgMode: 'solid',
      bgColor: '#09090b',
      bgColor2: '#1c1917',
      overlay: 'vignette',
      overlayIntensity: 35,
    },
  },
  {
    id: 'anime',
    label: 'Anime',
    tagline: 'Poster · soft · niebla',
    swatches: ['#a78bfa', '#0f0a1a', '#f5f3ff'],
    patch: {
      name: 'Anime',
      accent: '#a78bfa',
      accentSecondary: '#f5f3ff',
      title: 'SHONEN',
      subtitle: 'TRAINING ARC',
      stamp: 'ARC',
      doneText: 'GO',
      quotes: ['Power up', 'No te rindas', 'Nuevo nivel'],
      scene: 'clean',
      anim: 'breathe',
      layout: 'poster',
      font: 'rounded',
      mediaPos: 'top',
      bgMode: 'gradient',
      bgColor: '#0f0a1a',
      bgColor2: '#2e1065',
      overlay: 'mist',
      overlayIntensity: 45,
    },
  },
  {
    id: 'clean',
    label: 'Clean',
    tagline: 'Blanco · simple · sin FX',
    swatches: ['#ffffff', '#000000', '#e5e5e5'],
    patch: {
      name: 'Clean',
      accent: '#ffffff',
      accentSecondary: '#e5e5e5',
      title: 'TIMER',
      subtitle: '',
      stamp: 'SET',
      doneText: 'GO',
      quotes: ['Respira', 'Enfócate', 'Listo'],
      scene: 'clean',
      anim: 'none',
      layout: 'classic',
      font: 'soft',
      mediaPos: 'top',
      bgMode: 'solid',
      bgColor: '#000000',
      bgColor2: '#171717',
      overlay: 'none',
      overlayIntensity: 0,
    },
  },
]

export function applyThemePack(
  skin: TimerCustomSkinMeta,
  packId: TimerThemePackId,
): TimerCustomSkinMeta {
  const pack = TIMER_THEME_PACKS.find((p) => p.id === packId)
  if (!pack) return skin
  return {
    ...skin,
    ...pack.patch,
    name: pack.patch.name ?? skin.name,
    id: skin.id,
    hasGif: skin.hasGif,
    updatedAt: skin.updatedAt,
  }
}

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
  const base: TimerCustomSkinMeta = {
    id,
    name: 'Mi diseño',
    accent: '#ea580c',
    accentSecondary: '#ffedd5',
    title: 'FOCUS',
    subtitle: 'MI GYM',
    stamp: 'WORK',
    doneText: 'GO',
    quotes: ['Una serie más', 'Constancia', 'Hoy toca'],
    scene: 'clean',
    anim: 'pulse',
    layout: 'classic',
    font: 'display',
    mediaPos: 'top',
    bgMode: 'gradient',
    bgColor: '#0a0908',
    bgColor2: '#1c120a',
    overlay: 'grain',
    overlayIntensity: 40,
    hasGif: false,
    updatedAt: Date.now(),
  }
  return base
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
