export type UiLayoutId = 'classic' | 'focus'
export type FocusAccentId = 'green' | 'orange'

export const UI_LAYOUT_STORAGE_KEY = 'mi-gym-ui-layout'
export const FOCUS_ACCENT_STORAGE_KEY = 'mi-gym-focus-accent'

export const DEFAULT_UI_LAYOUT: UiLayoutId = 'classic'
export const DEFAULT_FOCUS_ACCENT: FocusAccentId = 'green'

export function isUiLayoutId(value: string): value is UiLayoutId {
  return value === 'classic' || value === 'focus'
}

export function isFocusAccentId(value: string): value is FocusAccentId {
  return value === 'green' || value === 'orange'
}

export function getStoredUiLayout(): UiLayoutId {
  try {
    const raw = localStorage.getItem(UI_LAYOUT_STORAGE_KEY)
    if (raw && isUiLayoutId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_UI_LAYOUT
}

export function getStoredFocusAccent(): FocusAccentId {
  try {
    const raw = localStorage.getItem(FOCUS_ACCENT_STORAGE_KEY)
    if (raw && isFocusAccentId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_FOCUS_ACCENT
}

/** Paleta Focus: base tierra cálida + acento vivo (muy distinta al clásico). */
export const FOCUS_ACCENTS: Record<
  FocusAccentId,
  {
    id: FocusAccentId
    name: string
    tagline: string
    metaColor: string
    swatch: string[]
    vars: Record<string, string>
  }
> = {
  green: {
    id: 'green',
    name: 'Focus Lima',
    tagline: 'Gym oscuro, acento vivo',
    metaColor: '#100e0c',
    swatch: ['#100e0c', '#1f1b17', '#a3e635', '#f4efe6'],
    vars: {
      '--font-sans': '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      '--font-display': '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
      '--color-fg': '#f4efe6',
      '--color-fg-muted': '#9a9186',
      '--color-chrome': '#a3e635',
      '--color-chrome-fg': '#14120f',
      '--color-chrome-soft': '#84cc16',
      '--color-surface': '#17140f',
      '--color-surface-elevated': '#221e18',
      '--color-line': '#3a342c',
      '--color-brand': '#a3e635',
      '--color-brand-soft': '#2a3218',
      '--color-brand-strong': '#bef264',
      '--color-accent': '#a3e635',
      '--color-accent-strong': '#84cc16',
      '--color-accent-fg': '#14120f',
      '--color-pending': '#8a8278',
      '--color-progress': '#38bdf8',
      '--color-done': '#a3e635',
      '--color-success-soft': '#2a3218',
      '--color-progress-soft': '#1a2a38',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(8, 6, 4, 0.78)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1200px 640px at 50% -20%, rgba(163,230,53,0.22) 0%, transparent 55%), radial-gradient(800px 500px at 100% 30%, rgba(60,40,20,0.45) 0%, transparent 50%), radial-gradient(700px 400px at 0% 80%, rgba(30,40,20,0.35) 0%, transparent 45%), linear-gradient(180deg, #0c0a08 0%, #12100c 40%, #0e0c0a 100%)',
    },
  },
  orange: {
    id: 'orange',
    name: 'Focus Ámbar',
    tagline: 'Calor y potencia',
    metaColor: '#120e0a',
    swatch: ['#120e0a', '#241c14', '#fb923c', '#f6f0e8'],
    vars: {
      '--font-sans': '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      '--font-display': '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
      '--color-fg': '#f6f0e8',
      '--color-fg-muted': '#a3988c',
      '--color-chrome': '#fb923c',
      '--color-chrome-fg': '#1a1008',
      '--color-chrome-soft': '#f97316',
      '--color-surface': '#18140f',
      '--color-surface-elevated': '#241c16',
      '--color-line': '#3f342a',
      '--color-brand': '#fb923c',
      '--color-brand-soft': '#3a2818',
      '--color-brand-strong': '#fdba74',
      '--color-accent': '#fb923c',
      '--color-accent-strong': '#f97316',
      '--color-accent-fg': '#1a1008',
      '--color-pending': '#8f857a',
      '--color-progress': '#38bdf8',
      '--color-done': '#fb923c',
      '--color-success-soft': '#3a2818',
      '--color-progress-soft': '#1a2a38',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(10, 6, 3, 0.78)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1200px 640px at 50% -20%, rgba(251,146,60,0.24) 0%, transparent 55%), radial-gradient(800px 500px at 100% 30%, rgba(80,40,10,0.4) 0%, transparent 50%), radial-gradient(700px 400px at 0% 80%, rgba(50,30,10,0.35) 0%, transparent 45%), linear-gradient(180deg, #0e0a07 0%, #14100c 40%, #100c08 100%)',
    },
  },
}
