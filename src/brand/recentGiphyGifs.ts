import type { GiphyGif } from '../api/giphy'

export const MAX_RECENT_GIPHY_GIFS = 5

const STORAGE_KEY = 'mi-gym-recent-giphy-gifs'

type StoredRecentGiphy = GiphyGif & { usedAt: number }

function readStored(): StoredRecentGiphy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is StoredRecentGiphy =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as StoredRecentGiphy).id === 'string' &&
        typeof (item as StoredRecentGiphy).previewUrl === 'string' &&
        typeof (item as StoredRecentGiphy).downloadUrl === 'string',
    )
  } catch {
    return []
  }
}

export function getRecentGiphyGifs(): GiphyGif[] {
  return readStored()
    .sort((a, b) => b.usedAt - a.usedAt)
    .slice(0, MAX_RECENT_GIPHY_GIFS)
    .map(({ usedAt: _usedAt, ...gif }) => gif)
}

export function rememberRecentGiphyGif(gif: GiphyGif): void {
  try {
    const kept = readStored().filter((item) => item.id !== gif.id)
    const next: StoredRecentGiphy[] = [
      { ...gif, usedAt: Date.now() },
      ...kept,
    ].slice(0, MAX_RECENT_GIPHY_GIFS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
