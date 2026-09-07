/** Convierte epoch ms local → ISO para timestamptz de Postgres */
export function msToIso(ms: number | undefined | null): string | null {
  if (ms == null || !Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

export function isoToMs(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined
  const n = Date.parse(iso)
  return Number.isFinite(n) ? n : undefined
}

export function isoToMsRequired(iso: string | null | undefined, fallback = Date.now()): number {
  return isoToMs(iso) ?? fallback
}
