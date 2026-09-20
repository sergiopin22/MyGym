/** Misma máquina aunque cambie mayúsculas, acentos u orden de palabras. */
export function machineIdentityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')
}

export function sameMachineName(a: string, b: string): boolean {
  const left = machineIdentityKey(a)
  const right = machineIdentityKey(b)
  return Boolean(left) && left === right
}
