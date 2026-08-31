export interface GiphyGif {
  id: string
  title: string
  previewUrl: string
  downloadUrl: string
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

  if (!preview || !download) return null

  const width = Number(images.fixed_height?.width ?? 200)
  const height = Number(images.fixed_height?.height ?? 200)

  return { id, title, previewUrl: preview, downloadUrl: download, width, height }
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

export async function downloadGiphyGif(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo descargar el GIF.')
  const blob = await res.blob()
  const type = blob.type || 'image/gif'
  return blob.type ? blob : new Blob([blob], { type })
}
