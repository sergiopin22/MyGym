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
    name: 'Focus Verde',
    tagline: 'Disciplina y progreso',
    metaColor: '#0b1210',
    swatch: ['#0b1210', '#15201c', '#22c55e', '#f4f7f5'],
    vars: {
      '--color-fg': '#f4f7f5',
      '--color-fg-muted': '#9aada3',
      '--color-chrome': '#22c55e',
      '--color-chrome-fg': '#04140c',
      '--color-chrome-soft': '#16a34a',
      '--color-surface': '#121a17',
      '--color-surface-elevated': '#1a2420',
      '--color-line': '#2a3832',
      '--color-brand': '#22c55e',
      '--color-brand-soft': '#143528',
      '--color-brand-strong': '#4ade80',
      '--color-accent': '#22c55e',
      '--color-accent-strong': '#16a34a',
      '--color-accent-fg': '#04140c',
      '--color-pending': '#7d8f86',
      '--color-progress': '#38bdf8',
      '--color-done': '#22c55e',
      '--color-success-soft': '#143528',
      '--color-progress-soft': '#0f2740',
      '--color-danger': '#f87171',
      '--color-danger-strong': '#ef4444',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(4, 10, 8, 0.72)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(900px 480px at 10% -10%, #143528 0%, transparent 55%), radial-gradient(700px 420px at 100% 0%, #0f2740 0%, transparent 50%), linear-gradient(180deg, #0b1210 0%, #0e1613 45%, #0b1210 100%)',
    },
  },
  orange: {
    id: 'orange',
    name: 'Focus Naranja',
    tagline: 'Energía y potencia',
    metaColor: '#140e0a',
    swatch: ['#140e0a', '#241910', '#f97316', '#f8f4f0'],
    vars: {
      '--color-fg': '#f8f4f0',
      '--color-fg-muted': '#a8998c',
      '--color-chrome': '#f97316',
      '--color-chrome-fg': '#1a0b02',
      '--color-chrome-soft': '#ea580c',
      '--color-surface': '#1a1410',
      '--color-surface-elevated': '#241c16',
      '--color-line': '#3a2e24',
      '--color-brand': '#f97316',
      '--color-brand-soft': '#3a2210',
      '--color-brand-strong': '#fb923c',
      '--color-accent': '#f97316',
      '--color-accent-strong': '#ea580c',
      '--color-accent-fg': '#1a0b02',
      '--color-pending': '#8f8378',
      '--color-progress': '#38bdf8',
      '--color-done': '#f97316',
      '--color-success-soft': '#3a2210',
      '--color-progress-soft': '#0f2740',
      '--color-danger': '#f87171',
      '--color-danger-strong': '#ef4444',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(12, 6, 2, 0.72)',
      '--color-ink': 'var(--color-fg)',
      '--color-ink-soft': 'var(--color-chrome-soft)',
      '--color-muted': 'var(--color-fg-muted)',
      '--body-background':
        'radial-gradient(900px 480px at 10% -10%, #3a2210 0%, transparent 55%), radial-gradient(700px 420px at 100% 0%, #2a1508 0%, transparent 50%), linear-gradient(180deg, #140e0a 0%, #18110c 45%, #140e0a 100%)',
    },
  },
}
