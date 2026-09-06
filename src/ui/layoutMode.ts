export type UiLayoutId = 'classic' | 'focus'

export const FOCUS_ACCENT_IDS = [
  'green',
  'orange',
  'dark',
  'blue',
  'red',
  'violet',
  'teal',
] as const

export type FocusAccentId = (typeof FOCUS_ACCENT_IDS)[number]

export const UI_LAYOUT_STORAGE_KEY = 'mi-gym-ui-layout'
export const FOCUS_ACCENT_STORAGE_KEY = 'mi-gym-focus-accent'

export const DEFAULT_UI_LAYOUT: UiLayoutId = 'classic'
export const DEFAULT_FOCUS_ACCENT: FocusAccentId = 'green'

export function isUiLayoutId(value: string): value is UiLayoutId {
  return value === 'classic' || value === 'focus'
}

export function isFocusAccentId(value: string): value is FocusAccentId {
  return (FOCUS_ACCENT_IDS as readonly string[]).includes(value)
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

const FOCUS_FONTS = {
  '--font-sans': '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  '--font-display': '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
} as const

/** Paletas Focus: cada una cambia acento + atmósfera. */
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
      ...FOCUS_FONTS,
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
      ...FOCUS_FONTS,
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
  dark: {
    id: 'dark',
    name: 'Focus Dark',
    tagline: 'Monocromo frío, cero ruido',
    metaColor: '#09090b',
    swatch: ['#09090b', '#18181b', '#e4e4e7', '#fafafa'],
    vars: {
      ...FOCUS_FONTS,
      '--color-fg': '#fafafa',
      '--color-fg-muted': '#a1a1aa',
      '--color-chrome': '#e4e4e7',
      '--color-chrome-fg': '#09090b',
      '--color-chrome-soft': '#a1a1aa',
      '--color-surface': '#121214',
      '--color-surface-elevated': '#1c1c1f',
      '--color-line': '#2e2e33',
      '--color-brand': '#e4e4e7',
      '--color-brand-soft': '#27272a',
      '--color-brand-strong': '#f4f4f5',
      '--color-accent': '#e4e4e7',
      '--color-accent-strong': '#d4d4d8',
      '--color-accent-fg': '#09090b',
      '--color-pending': '#71717a',
      '--color-progress': '#93c5fd',
      '--color-done': '#e4e4e7',
      '--color-success-soft': '#27272a',
      '--color-progress-soft': '#172554',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(0, 0, 0, 0.78)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1000px 560px at 50% -18%, rgba(255,255,255,0.08) 0%, transparent 55%), linear-gradient(180deg, #050506 0%, #0a0a0c 45%, #09090b 100%)',
    },
  },
  blue: {
    id: 'blue',
    name: 'Focus Blue',
    tagline: 'Hielo eléctrico',
    metaColor: '#060b14',
    swatch: ['#060b14', '#0f1a2a', '#38bdf8', '#e8f4ff'],
    vars: {
      ...FOCUS_FONTS,
      '--color-fg': '#e8f4ff',
      '--color-fg-muted': '#8aa0b8',
      '--color-chrome': '#38bdf8',
      '--color-chrome-fg': '#041018',
      '--color-chrome-soft': '#0ea5e9',
      '--color-surface': '#0c1420',
      '--color-surface-elevated': '#132033',
      '--color-line': '#243447',
      '--color-brand': '#38bdf8',
      '--color-brand-soft': '#12304a',
      '--color-brand-strong': '#7dd3fc',
      '--color-accent': '#38bdf8',
      '--color-accent-strong': '#0ea5e9',
      '--color-accent-fg': '#041018',
      '--color-pending': '#7b8fa3',
      '--color-progress': '#a78bfa',
      '--color-done': '#38bdf8',
      '--color-success-soft': '#12304a',
      '--color-progress-soft': '#1e1b4b',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(3, 8, 16, 0.8)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1100px 600px at 50% -16%, rgba(56,189,248,0.22) 0%, transparent 55%), radial-gradient(700px 420px at 100% 40%, rgba(14,60,100,0.35) 0%, transparent 50%), linear-gradient(180deg, #04080f 0%, #08111c 42%, #060b14 100%)',
    },
  },
  red: {
    id: 'red',
    name: 'Focus Red',
    tagline: 'Modo guerra',
    metaColor: '#120808',
    swatch: ['#120808', '#241111', '#f43f5e', '#ffe8ec'],
    vars: {
      ...FOCUS_FONTS,
      '--color-fg': '#ffe8ec',
      '--color-fg-muted': '#b89a9f',
      '--color-chrome': '#f43f5e',
      '--color-chrome-fg': '#1a0508',
      '--color-chrome-soft': '#e11d48',
      '--color-surface': '#181010',
      '--color-surface-elevated': '#261616',
      '--color-line': '#3f262a',
      '--color-brand': '#f43f5e',
      '--color-brand-soft': '#3f151c',
      '--color-brand-strong': '#fb7185',
      '--color-accent': '#f43f5e',
      '--color-accent-strong': '#e11d48',
      '--color-accent-fg': '#1a0508',
      '--color-pending': '#8f7a7d',
      '--color-progress': '#38bdf8',
      '--color-done': '#f43f5e',
      '--color-success-soft': '#3f151c',
      '--color-progress-soft': '#0f2740',
      '--color-danger': '#fda4af',
      '--color-danger-strong': '#fb7185',
      '--color-danger-fg': '#1a0508',
      '--color-overlay': 'rgba(12, 4, 6, 0.8)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1100px 600px at 50% -16%, rgba(244,63,94,0.22) 0%, transparent 55%), radial-gradient(700px 420px at 0% 70%, rgba(80,20,30,0.4) 0%, transparent 50%), linear-gradient(180deg, #0c0607 0%, #140a0b 42%, #120808 100%)',
    },
  },
  violet: {
    id: 'violet',
    name: 'Focus Violet',
    tagline: 'Neón nocturno',
    metaColor: '#0d0814',
    swatch: ['#0d0814', '#1a1028', '#a78bfa', '#f3eefe'],
    vars: {
      ...FOCUS_FONTS,
      '--color-fg': '#f3eefe',
      '--color-fg-muted': '#a698b8',
      '--color-chrome': '#a78bfa',
      '--color-chrome-fg': '#12081f',
      '--color-chrome-soft': '#8b5cf6',
      '--color-surface': '#14101c',
      '--color-surface-elevated': '#1e172c',
      '--color-line': '#342a48',
      '--color-brand': '#a78bfa',
      '--color-brand-soft': '#2a1f45',
      '--color-brand-strong': '#c4b5fd',
      '--color-accent': '#a78bfa',
      '--color-accent-strong': '#8b5cf6',
      '--color-accent-fg': '#12081f',
      '--color-pending': '#8a8098',
      '--color-progress': '#38bdf8',
      '--color-done': '#a78bfa',
      '--color-success-soft': '#2a1f45',
      '--color-progress-soft': '#0f2740',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(8, 4, 14, 0.8)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1100px 600px at 50% -16%, rgba(167,139,250,0.24) 0%, transparent 55%), radial-gradient(700px 420px at 100% 60%, rgba(60,30,100,0.35) 0%, transparent 50%), linear-gradient(180deg, #090510 0%, #100a18 42%, #0d0814 100%)',
    },
  },
  teal: {
    id: 'teal',
    name: 'Focus Teal',
    tagline: 'Agua profunda',
    metaColor: '#061210',
    swatch: ['#061210', '#0f221e', '#2dd4bf', '#e6fffa'],
    vars: {
      ...FOCUS_FONTS,
      '--color-fg': '#e6fffa',
      '--color-fg-muted': '#8aada5',
      '--color-chrome': '#2dd4bf',
      '--color-chrome-fg': '#04201b',
      '--color-chrome-soft': '#14b8a6',
      '--color-surface': '#0c1a17',
      '--color-surface-elevated': '#132722',
      '--color-line': '#264039',
      '--color-brand': '#2dd4bf',
      '--color-brand-soft': '#123832',
      '--color-brand-strong': '#5eead4',
      '--color-accent': '#2dd4bf',
      '--color-accent-strong': '#14b8a6',
      '--color-accent-fg': '#04201b',
      '--color-pending': '#7d968f',
      '--color-progress': '#38bdf8',
      '--color-done': '#2dd4bf',
      '--color-success-soft': '#123832',
      '--color-progress-soft': '#0f2740',
      '--color-danger': '#fb7185',
      '--color-danger-strong': '#f43f5e',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(3, 12, 10, 0.8)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(1100px 600px at 50% -16%, rgba(45,212,191,0.2) 0%, transparent 55%), radial-gradient(700px 420px at 0% 50%, rgba(20,80,70,0.35) 0%, transparent 50%), linear-gradient(180deg, #040c0a 0%, #0a1613 42%, #061210 100%)',
    },
  },
}
