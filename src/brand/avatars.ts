export type BrandAvatarId = 'ippo' | 'luffy' | 'asta'

export interface BrandAvatar {
  id: BrandAvatarId
  name: string
  tagline: string
  src: string
  /** object-fit: contain para gifs cuadrados; cover para fotos */
  fit: 'contain' | 'cover'
}

export const BRAND_AVATAR_STORAGE_KEY = 'mi-gym-brand-avatar'

export const BRAND_AVATARS: BrandAvatar[] = [
  {
    id: 'ippo',
    name: 'Ippo',
    tagline: 'Disciplina',
    src: '/brand/ippo.gif',
    fit: 'contain',
  },
  {
    id: 'luffy',
    name: 'Luffy',
    tagline: 'Gear up',
    src: '/brand/luffy.gif',
    fit: 'cover',
  },
  {
    id: 'asta',
    name: 'Asta',
    tagline: 'Nunca rendirse',
    src: '/brand/asta.jpg',
    fit: 'cover',
  },
]

export const DEFAULT_BRAND_AVATAR_ID: BrandAvatarId = 'ippo'

export function isBrandAvatarId(value: string): value is BrandAvatarId {
  return BRAND_AVATARS.some((a) => a.id === value)
}

export function getStoredBrandAvatarId(): BrandAvatarId {
  try {
    const saved = localStorage.getItem(BRAND_AVATAR_STORAGE_KEY)
    if (saved && isBrandAvatarId(saved)) return saved
  } catch {
    /* ignore */
  }
  return DEFAULT_BRAND_AVATAR_ID
}

export function setStoredBrandAvatarId(id: BrandAvatarId): void {
  try {
    localStorage.setItem(BRAND_AVATAR_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function getBrandAvatar(id: BrandAvatarId): BrandAvatar {
  return BRAND_AVATARS.find((a) => a.id === id) ?? BRAND_AVATARS[0]
}
