import { useSyncExternalStore } from 'react'
import {
  setPrCelebrationColors,
  type PrCelebrationPalette,
} from './prCelebrationColors'

/** Tope del subtítulo (LÍMITE ROTO). Más de esto se parte en el iPhone. */
export const PR_KICKER_MAX = 18
/** Tope del título grande. Cabe en 2 líneas. */
export const PR_TITLE_MAX = 32

export type PrAnimeId =
  | 'clover'
  | 'goku'
  | 'ippo'
  | 'luffy'
  | 'vinland'
  | 'custom'

export interface PrAnimeTheme {
  name: string
  tagline: string
  kicker: string
  title: string
  countKicker: string
  countTitle: string
  giphyQuery: string
  palette: PrCelebrationPalette
}

export interface PrCelebrationCopy {
  anime: PrAnimeId
  kicker: string
  title: string
  giphyQuery: string
}

export const PR_CELEBRATION_COPY_KEY = 'mi-gym-pr-celebration-copy'

export const PR_ANIME_THEMES: Record<
  Exclude<PrAnimeId, 'custom'>,
  PrAnimeTheme
> = {
  clover: {
    name: 'Black Clover',
    tagline: 'Asta · rompe el límite',
    kicker: 'Límite roto',
    title: '¡Rompiste el límite!',
    countKicker: 'Rompiendo',
    countTitle: 'Rompiendo el límite…',
    giphyQuery: 'asta black clover',
    palette: {
      bg: '#000000',
      kicker: '#c80000',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#c80000',
    },
  },
  goku: {
    name: 'Goku',
    tagline: 'Dragon Ball · Super Saiyajin',
    kicker: 'Ultra instinto',
    title: '¡Aún puedo más!',
    countKicker: 'Kaioken',
    countTitle: 'El poder sube…',
    giphyQuery: 'goku super saiyan',
    palette: {
      bg: '#000000',
      kicker: '#f97316',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#f97316',
    },
  },
  ippo: {
    name: 'Ippo',
    tagline: 'Hajime no Ippo · azul, blanco y rojo',
    kicker: 'Espíritu de lucha',
    title: '¡El espíritu de lucha!',
    countKicker: 'A pelear',
    countTitle: '¡Demuestra tu fuerza!',
    giphyQuery: 'ippo makunouchi',
    palette: {
      bg: '#1636a8',
      kicker: '#e10600',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#e10600',
    },
  },
  luffy: {
    name: 'Luffy',
    tagline: 'One Piece · rey de los piratas',
    kicker: 'Rey de los piratas',
    title: '¡Nada me va a parar!',
    countKicker: 'Gear up',
    countTitle: '¡Hacia el récord!',
    giphyQuery: 'luffy one piece',
    palette: {
      bg: '#000000',
      kicker: '#e11d48',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#e11d48',
    },
  },
  vinland: {
    name: 'Vinland Saga',
    tagline: 'Thorfinn · no tengo enemigos',
    kicker: 'No tengo enemigos',
    title: '¡Un verdadero guerrero!',
    countKicker: 'Avanza',
    countTitle: 'Un paso más lejos',
    giphyQuery: 'thorfinn vinland saga',
    palette: {
      bg: '#000000',
      kicker: '#d97706',
      title: '#ffffff',
      nums: '#ffffff',
      button: '#d97706',
    },
  },
}

export const DEFAULT_PR_CELEBRATION_COPY: PrCelebrationCopy = {
  anime: 'clover',
  kicker: PR_ANIME_THEMES.clover.kicker,
  title: PR_ANIME_THEMES.clover.title,
  giphyQuery: PR_ANIME_THEMES.clover.giphyQuery,
}

const ANIME_IDS: PrAnimeId[] = [
  'clover',
  'goku',
  'ippo',
  'luffy',
  'vinland',
  'custom',
]

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

function isAnimeId(value: string): value is PrAnimeId {
  return ANIME_IDS.includes(value as PrAnimeId)
}

export function limitPrText(value: string, max: number): string {
  const clean = value.replace(/[\n\r\t]/g, '').replace(/\s+/g, ' ')
  return [...clean].slice(0, max).join('')
}

function sanitize(raw: unknown): PrCelebrationCopy {
  if (!raw || typeof raw !== 'object') return DEFAULT_PR_CELEBRATION_COPY
  const row = raw as Record<string, unknown>
  const anime =
    typeof row.anime === 'string' && isAnimeId(row.anime)
      ? row.anime
      : 'custom'
  const kicker =
    typeof row.kicker === 'string'
      ? limitPrText(row.kicker, PR_KICKER_MAX)
      : DEFAULT_PR_CELEBRATION_COPY.kicker
  const title =
    typeof row.title === 'string'
      ? limitPrText(row.title, PR_TITLE_MAX)
      : DEFAULT_PR_CELEBRATION_COPY.title
  const giphyQuery =
    typeof row.giphyQuery === 'string' && row.giphyQuery.trim()
      ? row.giphyQuery.trim().slice(0, 80)
      : DEFAULT_PR_CELEBRATION_COPY.giphyQuery
  return {
    anime,
    kicker: kicker.trim() ? kicker : DEFAULT_PR_CELEBRATION_COPY.kicker,
    title: title.trim() ? title : DEFAULT_PR_CELEBRATION_COPY.title,
    giphyQuery,
  }
}

function loadFromStorage(): PrCelebrationCopy {
  try {
    const raw = localStorage.getItem(PR_CELEBRATION_COPY_KEY)
    if (!raw) return DEFAULT_PR_CELEBRATION_COPY
    return sanitize(JSON.parse(raw) as unknown)
  } catch {
    return DEFAULT_PR_CELEBRATION_COPY
  }
}

export function getPrCelebrationCopy(): PrCelebrationCopy {
  return cache
}

export function setPrCelebrationCopy(next: PrCelebrationCopy) {
  cache = sanitize(next)
  try {
    localStorage.setItem(PR_CELEBRATION_COPY_KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
  emit()
}

export function selectPrAnimeTheme(id: Exclude<PrAnimeId, 'custom'>) {
  const theme = PR_ANIME_THEMES[id]
  setPrCelebrationCopy({
    anime: id,
    kicker: theme.kicker,
    title: theme.title,
    giphyQuery: theme.giphyQuery,
  })
  setPrCelebrationColors({
    preset: id === 'clover' ? 'clover' : 'custom',
    ...theme.palette,
  })
}

export function patchPrCelebrationPhrase(
  key: 'kicker' | 'title',
  value: string,
) {
  const max = key === 'kicker' ? PR_KICKER_MAX : PR_TITLE_MAX
  setPrCelebrationCopy({
    ...cache,
    anime: 'custom',
    [key]: limitPrText(value, max),
  })
}

export function displayPrKicker(
  copy: PrCelebrationCopy,
  phase: 'count' | 'done',
): string {
  if (phase === 'done') return copy.kicker
  if (copy.anime === 'custom') return 'Nuevo PR'
  return PR_ANIME_THEMES[copy.anime].countKicker
}

export function displayPrTitle(
  copy: PrCelebrationCopy,
  phase: 'count' | 'done',
): string {
  if (phase === 'done') return copy.title
  if (copy.anime === 'custom') return 'Subiendo la marca…'
  return PR_ANIME_THEMES[copy.anime].countTitle
}

export function prAnimeLabel(copy: PrCelebrationCopy): string {
  if (copy.anime === 'custom') return 'Tus frases'
  return PR_ANIME_THEMES[copy.anime].name
}

export function initPrCelebrationCopy() {
  cache = loadFromStorage()
}

export function usePrCelebrationCopy() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== PR_CELEBRATION_COPY_KEY) return
    cache = loadFromStorage()
    emit()
  })
}
