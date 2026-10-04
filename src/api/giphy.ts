export interface GiphyGif {
  id: string
  title: string
  previewUrl: string
  downloadUrl: string
  /** Mejor calidad para pantalla completa (webp/mp4/gif grande). */
  hdUrl: string
  width: number
  height: number
}

const API_BASE = 'https://api.giphy.com/v1/gifs'

function apiKey(): string {
  return import.meta.env.VITE_GIPHY_API_KEY?.trim() ?? ''
}

export function isGiphyConfigured(): boolean {
  return apiKey().length > 0
}

function pickHdAsset(images: Record<string, Record<string, string>>): {
  url: string
  width: number
  height: number
} | undefined {
  let best:
    | { url: string; width: number; height: number; score: number }
    | undefined

  for (const [name, img] of Object.entries(images)) {
    if (!img) continue
    const width = Number(img.width) || 0
    const height = Number(img.height) || 0
    const mp4 = typeof img.mp4 === 'string' ? img.mp4 : ''
    const webp = typeof img.webp === 'string' ? img.webp : ''
    const gif = typeof img.url === 'string' ? img.url : ''
    const url = mp4 || webp || gif
    if (!url || width < 2 || height < 2) continue
    const still = name.includes('still')
    const preview =
      name === 'preview' ||
      name.startsWith('preview_') ||
      name.includes('small') ||
      name.includes('tiny')
    const typeBonus = mp4 ? 30 : webp ? 20 : 10
    const score =
      width * height +
      typeBonus +
      (still ? -1_000_000 : 0) +
      (preview ? -100_000 : 0)
    if (!best || score > best.score) {
      best = { url, width, height, score }
    }
  }

  return best ? { url: best.url, width: best.width, height: best.height } : undefined
}

function mapGif(raw: Record<string, unknown>): GiphyGif | null {
  const id = typeof raw.id === 'string' ? raw.id : ''
  const title = typeof raw.title === 'string' ? raw.title : 'GIF'
  const images = raw.images as Record<string, Record<string, string>> | undefined
  if (!id || !images) return null

  const preview =
    images.fixed_height_small?.webp ??
    images.fixed_height_small?.url ??
    images.downsized_still?.url ??
    images.fixed_height?.url
  const download =
    images.downsized?.url ??
    images.fixed_height?.url ??
    images.preview_gif?.url
  const hd = pickHdAsset(images)

  if (!preview || !download || !hd) return null

  return {
    id,
    title,
    previewUrl: preview,
    downloadUrl: download,
    hdUrl: hd.url,
    width: hd.width,
    height: hd.height,
  }
}

async function fetchGifs(path: string): Promise<GiphyGif[]> {
  const key = apiKey()
  if (!key) {
    throw new Error(
      'Falta VITE_GIPHY_API_KEY. Agrégala en .env o en Vercel → Environment Variables.',
    )
  }

  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`Giphy respondió ${res.status}. Revisa tu API key.`)
  }

  const json = (await res.json()) as { data?: unknown[] }
  const list = Array.isArray(json.data) ? json.data : []
  return list
    .map((item) => mapGif(item as Record<string, unknown>))
    .filter((g): g is GiphyGif => g != null)
}

export function searchGiphy(query: string, limit = 24): Promise<GiphyGif[]> {
  const q = query.trim()
  if (!q) return fetchTrendingGiphy(limit)
  const key = apiKey()
  const params = new URLSearchParams({
    api_key: key,
    q,
    limit: String(limit),
    rating: 'g',
    lang: 'es',
  })
  return fetchGifs(`/search?${params}`)
}

export function fetchTrendingGiphy(limit = 24): Promise<GiphyGif[]> {
  const key = apiKey()
  const params = new URLSearchParams({
    api_key: key,
    limit: String(limit),
    rating: 'g',
  })
  return fetchGifs(`/trending?${params}`)
}

export async function fetchGiphyGifById(id: string): Promise<GiphyGif | null> {
  const key = apiKey()
  if (!key) return null
  const params = new URLSearchParams({ api_key: key })
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}?${params}`)
  if (!res.ok) return null
  const json = (await res.json()) as { data?: unknown }
  if (!json.data || typeof json.data !== 'object' || Array.isArray(json.data)) {
    return null
  }
  return mapGif(json.data as Record<string, unknown>)
}

export async function downloadGiphyGif(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo descargar el GIF.')
  const blob = await res.blob()
  const type =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob.type
      : guessMime(url)
  return type === blob.type ? blob : new Blob([blob], { type })
}

function guessMime(url: string): string {
  const clean = url.split('?')[0]?.toLowerCase() ?? ''
  if (clean.endsWith('.mp4') || clean.includes('.mp4')) return 'video/mp4'
  if (clean.endsWith('.webp') || clean.includes('.webp')) return 'image/webp'
  return 'image/gif'
}

export async function downloadGiphyHd(gif: GiphyGif): Promise<Blob> {
  const full = (await fetchGiphyGifById(gif.id)) ?? gif
  const urls = [...new Set([full.hdUrl, gif.hdUrl, full.downloadUrl, gif.downloadUrl])]
  let lastError: unknown
  for (const url of urls) {
    if (!url) continue
    try {
      return await downloadGiphyGif(url)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('No se pudo descargar el GIF en HD.')
}
