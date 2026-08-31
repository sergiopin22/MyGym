import type { GiphyGif } from '../api/giphy'
import { downloadGiphyGif } from '../api/giphy'
import { rememberRecentGiphyGif } from '../brand/recentGiphyGifs'
import { db } from './schema'

export const CUSTOM_AVATAR_ID = 'avatar' as const

export interface CustomAvatarRecord {
  id: typeof CUSTOM_AVATAR_ID
  giphyId: string
  title: string
  blob: Blob
  mimeType: string
  updatedAt: number
}

export async function getCustomAvatarRecord(): Promise<CustomAvatarRecord | undefined> {
  return db.customAvatarGifs.get(CUSTOM_AVATAR_ID)
}

export async function saveCustomAvatarFromGiphy(gif: GiphyGif): Promise<CustomAvatarRecord> {
  const blob = await downloadGiphyGif(gif.downloadUrl)
  const record: CustomAvatarRecord = {
    id: CUSTOM_AVATAR_ID,
    giphyId: gif.id,
    title: gif.title,
    blob,
    mimeType: blob.type || 'image/gif',
    updatedAt: Date.now(),
  }
  await db.customAvatarGifs.put(record)
  rememberRecentGiphyGif(gif)
  return record
}

export async function clearCustomAvatar(): Promise<void> {
  await db.customAvatarGifs.delete(CUSTOM_AVATAR_ID)
}
