import type { GiphyGif } from '../api/giphy'
import { downloadGiphyHd } from '../api/giphy'
import { rememberRecentGiphyGif } from '../brand/recentGiphyGifs'
import type { PrNamedAnimeId } from '../features/workout/prCelebrationCopy'
import { db } from './schema'

/** Slot viejo, de cuando había un solo GIF para todos los temas. */
export const PR_CELEBRATION_GIF_ID = 'pr-gif' as const

export function prCelebrationGifId(theme: PrNamedAnimeId): string {
  return `pr-gif-${theme}`
}

export interface PrCelebrationGifRecord {
  id: string
  giphyId: string
  title: string
  blob: Blob
  mimeType: string
  updatedAt: number
  width?: number
  height?: number
}

let migratedLegacy = false

/** El GIF único anterior pasa a Black Clover, que era el tema por defecto. */
async function migrateLegacyPrGif(): Promise<void> {
  if (migratedLegacy) return
  migratedLegacy = true
  const legacy = await db.prCelebrationGifs.get(PR_CELEBRATION_GIF_ID)
  if (!legacy) return
  const cloverId = prCelebrationGifId('clover')
  const clover = await db.prCelebrationGifs.get(cloverId)
  if (!clover) {
    await db.prCelebrationGifs.put({ ...legacy, id: cloverId })
  }
}

export async function getPrCelebrationGif(
  theme: PrNamedAnimeId,
): Promise<PrCelebrationGifRecord | undefined> {
  await migrateLegacyPrGif()
  return db.prCelebrationGifs.get(prCelebrationGifId(theme))
}

async function readMediaSize(
  blob: Blob,
): Promise<{ width: number; height: number } | undefined> {
  const url = URL.createObjectURL(blob)
  try {
    if (blob.type.startsWith('video/')) {
      return await new Promise((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          resolve(
            video.videoWidth
              ? { width: video.videoWidth, height: video.videoHeight }
              : undefined,
          )
        }
        video.onerror = () => resolve(undefined)
        video.src = url
      })
    }
    return await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve(
          img.naturalWidth
            ? { width: img.naturalWidth, height: img.naturalHeight }
            : undefined,
        )
      }
      img.onerror = () => resolve(undefined)
      img.src = url
    })
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }
}

export async function savePrCelebrationGifFromGiphy(
  gif: GiphyGif,
  theme: PrNamedAnimeId,
): Promise<PrCelebrationGifRecord> {
  const blob = await downloadGiphyHd(gif)
  const size = (await readMediaSize(blob)) ?? {
    width: gif.width,
    height: gif.height,
  }
  const record = await putPrCelebrationGif(theme, {
    giphyId: gif.id,
    title: gif.title,
    blob,
    width: size.width,
    height: size.height,
  })
  rememberRecentGiphyGif(gif)
  return record
}

export async function savePrCelebrationGifFromFile(
  file: File,
  theme: PrNamedAnimeId,
): Promise<PrCelebrationGifRecord> {
  const size = await readMediaSize(file)
  return putPrCelebrationGif(theme, {
    giphyId: 'file',
    title: file.name || 'GIF de PR',
    blob: file,
    width: size?.width,
    height: size?.height,
  })
}

export async function clearPrCelebrationGif(
  theme: PrNamedAnimeId,
): Promise<void> {
  await db.prCelebrationGifs.delete(prCelebrationGifId(theme))
}

async function putPrCelebrationGif(
  theme: PrNamedAnimeId,
  input: {
    giphyId: string
    title: string
    blob: Blob
    width?: number
    height?: number
  },
): Promise<PrCelebrationGifRecord> {
  const record: PrCelebrationGifRecord = {
    id: prCelebrationGifId(theme),
    giphyId: input.giphyId,
    title: input.title,
    blob: input.blob,
    mimeType: input.blob.type || 'image/gif',
    updatedAt: Date.now(),
    width: input.width,
    height: input.height,
  }
  await db.prCelebrationGifs.put(record)
  return record
}
