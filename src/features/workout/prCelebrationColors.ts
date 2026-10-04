import { useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'

export type PrCelebrationPresetId = 'clover' | 'violet' | 'mono' | 'custom'

export interface PrCelebrationPalette {
  kicker: string
  title: string
  nums: string
  button: string
}

export interface PrCelebrationColors extends PrCelebrationPalette {
  preset: PrCelebrationPresetId
}

export const PR_CELEBRATION_STORAGE_KEY = 'mi-gym-pr-celebration-colors'

export const PR_CELEBRATION_PRESETS: Record<
  Exclude<PrCelebrationPresetId, 'custom'>,
  { name: string; tagline: string; colors: PrCelebrationPalette }
> = {
  clover: {
    name: 'Clover',
    tagline: 'Rojo, negro y blanco',
    colors: {
      kicker: '#c80000',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#c80000',
    },
  },
  violet: {
    name: 'Violeta',
    tagline: 'Púrpura, negro y blanco',
    colors: {
      kicker: '#a855f7',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#7c3aed',
    },
  },
  mono: {
    name: 'Mono',
    tagline: 'Solo blanco y negro',
    colors: {
      kicker: '#ffffff',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#ffffff',
    },
  },
}

export const DEFAULT_PR_CELEBRATION_COLORS: PrCelebrationColors = {
  preset: 'clover',
  ...PR_CELEBRATION_PRESETS.clover.colors,
}

const PRESET_IDS = ['clover', 'violet', 'mono', 'custom'] as const
const HEX = /^#([0-9a-f]{6})$/i

const listeners = new Set<() => void>()
let cache = loadFromStorage()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return cache
}

export function normalizeHex(value: string): string | null {
  const raw = value.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(raw)
  if (short) {
    const [r, g, b] = short[1]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  const full = HEX.exec(raw)
  return full ? `#${full[1]}`.toLowerCase() : null
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return [
    Number.parseInt(n.slice(1, 3), 16),
    Number.parseInt(n.slice(3, 5), 16),
    Number.parseInt(n.slice(5, 7), 16),
  ]
}

export function buttonForeground(button: string): string {
  const rgb = hexToRgb(button)
  if (!rgb) return '#ffffff'
  const [r, g, b] = rgb.map((c) => c / 255) as [number, number, number]
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 0.62 ? '#000000' : '#ffffff'
}

function isPresetId(value: string): value is PrCelebrationPresetId {
  return (PRESET_IDS as readonly string[]).includes(value)
}

function sanitize(raw: unknown): PrCelebrationColors {
  if (!raw || typeof raw !== 'object') return DEFAULT_PR_CELEBRATION_COLORS
  const row = raw as Record<string, unknown>
  const kicker = typeof row.kicker === 'string' ? normalizeHex(row.kicker) : null
  const title = typeof row.title === 'string' ? normalizeHex(row.title) : null
  const nums = typeof row.nums === 'string' ? normalizeHex(row.nums) : null
  const button = typeof row.button === 'string' ? normalizeHex(row.button) : null
  if (!kicker || !title || !nums || !button) return DEFAULT_PR_CELEBRATION_COLORS
  const preset =
    typeof row.preset === 'string' && isPresetId(row.preset)
      ? row.preset
      : 'custom'
  return { preset, kicker, title, nums, button }
}

function loadFromStorage(): PrCelebrationColors {
  try {
    const raw = localStorage.getItem(PR_CELEBRATION_STORAGE_KEY)
    if (!raw) return DEFAULT_PR_CELEBRATION_COLORS
    return sanitize(JSON.parse(raw) as unknown)
  } catch {
    return DEFAULT_PR_CELEBRATION_COLORS
  }
}

export function prCelebrationCssVars(
  colors: PrCelebrationColors,
): CSSProperties {
  return {
    ['--pr-kicker' as string]: colors.kicker,
    ['--pr-title' as string]: colors.title,
    ['--pr-nums' as string]: colors.nums,
    ['--pr-btn' as string]: colors.button,
    ['--pr-btn-fg' as string]: buttonForeground(colors.button),
    ['--pr-accent' as string]: colors.kicker,
  }
}

export function applyPrCelebrationCssVars(
  el: HTMLElement,
  colors: PrCelebrationColors,
) {
  const vars = prCelebrationCssVars(colors) as Record<string, string>
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value)
  }
}

export function getPrCelebrationColors(): PrCelebrationColors {
  return cache
}

export function setPrCelebrationColors(next: PrCelebrationColors) {
  cache = sanitize(next)
  try {
    localStorage.setItem(PR_CELEBRATION_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
  applyPrCelebrationCssVars(document.documentElement, cache)
  emit()
}

export function selectPrCelebrationPreset(
  id: Exclude<PrCelebrationPresetId, 'custom'>,
) {
  setPrCelebrationColors({
    preset: id,
    ...PR_CELEBRATION_PRESETS[id].colors,
  })
}

export function patchPrCelebrationColor(
  key: keyof PrCelebrationPalette,
  value: string,
) {
  const hex = normalizeHex(value)
  if (!hex) return
  setPrCelebrationColors({
    ...cache,
    preset: 'custom',
    [key]: hex,
  })
}

export function initPrCelebrationColors() {
  cache = loadFromStorage()
  applyPrCelebrationCssVars(document.documentElement, cache)
}

export function usePrCelebrationColors() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== PR_CELEBRATION_STORAGE_KEY) return
    cache = loadFromStorage()
    applyPrCelebrationCssVars(document.documentElement, cache)
    emit()
  })
}
