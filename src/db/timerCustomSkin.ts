import type { GiphyGif } from '../api/giphy'
import { downloadGiphyHd } from '../api/giphy'
import { rememberRecentGiphyGif } from '../brand/recentGiphyGifs'
import { db } from './schema'

export interface TimerCustomGifRecord {
  id: string
  giphyId: string
  title: string
  blob: Blob
  mimeType: string
  updatedAt: number
  width?: number
  height?: number
}

export async function getTimerCustomGif(
  skinId: string,
): Promise<TimerCustomGifRecord | undefined> {
  return db.timerCustomSkins.get(skinId)
}

export async function saveTimerCustomGifFromGiphy(
  skinId: string,
  gif: GiphyGif,
): Promise<TimerCustomGifRecord> {
  const blob = await downloadGiphyHd(gif)
  const size = (await readMediaSize(blob)) ?? {
    width: gif.width,
    height: gif.height,
  }
  const record = await putTimerCustomGif(skinId, {
    giphyId: gif.id,
    title: gif.title,
    blob,
    width: size.width,
    height: size.height,
  })
  rememberRecentGiphyGif(gif)
  return record
}

export async function saveTimerCustomGifFromFile(
  skinId: string,
  file: File,
): Promise<TimerCustomGifRecord> {
  const size = await readMediaSize(file)
  return putTimerCustomGif(skinId, {
    giphyId: 'file',
    title: file.name || 'GIF del timer',
    blob: file,
    width: size?.width,
    height: size?.height,
  })
}

export async function clearTimerCustomGif(skinId: string): Promise<void> {
  await db.timerCustomSkins.delete(skinId)
}

async function putTimerCustomGif(
  skinId: string,
  input: {
    giphyId: string
    title: string
    blob: Blob
    width?: number
    height?: number
  },
): Promise<TimerCustomGifRecord> {
  const record: TimerCustomGifRecord = {
    id: skinId,
    giphyId: input.giphyId,
    title: input.title,
    blob: input.blob,
    mimeType: input.blob.type || 'image/gif',
    updatedAt: Date.now(),
    width: input.width,
    height: input.height,
  }
  await db.timerCustomSkins.put(record)
  return record
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
