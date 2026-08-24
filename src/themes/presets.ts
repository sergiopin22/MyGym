export type ThemeId =
  | 'classic'
  | 'underground-red'
  | 'underground-blue'
  | 'midnight'

export interface ThemePreset {
  id: ThemeId
  name: string
  tagline: string
  /** Colores para la miniatura del selector */
  swatch: [string, string, string]
  metaColor: string
  vars: Record<string, string>
}

export const THEME_STORAGE_KEY = 'mi-gym-theme'
export const DEFAULT_THEME_ID: ThemeId = 'classic'

export const THEMES: ThemePreset[] = [
  {
    id: 'classic',
    name: 'Clásico',
    tagline: 'Azul claro · blanco · negro',
    swatch: ['#e7f3fb', '#2f8fd6', '#0a0a0a'],
    metaColor: '#e7f3fb',
    vars: {
      '--color-fg': '#0a0a0a',
      '--color-fg-muted': '#4d6273',
      '--color-chrome': '#0a0a0a',
      '--color-chrome-fg': '#ffffff',
      '--color-chrome-soft': '#1c1c1c',
      '--color-surface': '#e7f3fb',
      '--color-surface-elevated': '#ffffff',
      '--color-line': '#c3daf0',
      '--color-brand': '#2f8fd6',
      '--color-brand-soft': '#d4ebfa',
      '--color-brand-strong': '#1a6fad',
      '--color-accent': '#16a34a',
      '--color-accent-strong': '#15803d',
      '--color-progress': '#2563eb',
      '--color-success-soft': '#dcfce7',
      '--color-progress-soft': '#dbeafe',
      '--color-danger': '#dc2626',
      '--color-danger-strong': '#b91c1c',
      '--color-overlay': 'rgba(10, 10, 10, 0.45)',
      '--body-background':
        'radial-gradient(1100px 520px at 8% -8%, #cfe8f9 0%, transparent 55%), radial-gradient(900px 480px at 100% 0%, #eef6fc 0%, transparent 52%), linear-gradient(180deg, #f4faff 0%, #e7f3fb 40%, #e7f3fb 100%)',
    },
  },
  {
    id: 'underground-red',
    name: 'Underground Rojo',
    tagline: 'Dark · rojo · negro · blanco',
    swatch: ['#0a0a0a', '#ef4444', '#f5f5f5'],
    metaColor: '#0a0a0a',
    vars: {
      '--color-fg': '#f5f5f5',
      '--color-fg-muted': '#a3a3a3',
      '--color-chrome': '#ef4444',
      '--color-chrome-fg': '#ffffff',
      '--color-chrome-soft': '#b91c1c',
      '--color-surface': '#0a0a0a',
      '--color-surface-elevated': '#141414',
      '--color-line': '#2b2b2b',
      '--color-brand': '#ef4444',
      '--color-brand-soft': '#2a1212',
      '--color-brand-strong': '#dc2626',
      '--color-accent': '#ef4444',
      '--color-accent-strong': '#b91c1c',
      '--color-progress': '#f87171',
      '--color-success-soft': '#1f1515',
      '--color-progress-soft': '#1a1212',
      '--color-danger': '#991b1b',
      '--color-danger-strong': '#7f1d1d',
      '--color-overlay': 'rgba(0, 0, 0, 0.72)',
      '--body-background':
        'radial-gradient(900px 480px at 0% -10%, rgba(239, 68, 68, 0.22) 0%, transparent 55%), radial-gradient(700px 420px at 100% 0%, rgba(127, 29, 29, 0.35) 0%, transparent 50%), linear-gradient(180deg, #050505 0%, #0a0a0a 45%, #0f0f0f 100%)',
    },
  },
  {
    id: 'underground-blue',
    name: 'Underground Azul',
    tagline: 'Dark · azul eléctrico · vibe gym',
    swatch: ['#050810', '#3b82f6', '#22d3ee'],
    metaColor: '#050810',
    vars: {
      '--color-fg': '#e8f4ff',
      '--color-fg-muted': '#7a9bb8',
      '--color-chrome': '#3b82f6',
      '--color-chrome-fg': '#ffffff',
      '--color-chrome-soft': '#1d4ed8',
      '--color-surface': '#050810',
      '--color-surface-elevated': '#0b1220',
      '--color-line': '#1a2744',
      '--color-brand': '#3b82f6',
      '--color-brand-soft': '#0f1a2e',
      '--color-brand-strong': '#2563eb',
      '--color-accent': '#22d3ee',
      '--color-accent-strong': '#0891b2',
      '--color-progress': '#60a5fa',
      '--color-success-soft': '#0c1f1f',
      '--color-progress-soft': '#0f1a2e',
      '--color-danger': '#f87171',
      '--color-danger-strong': '#dc2626',
      '--color-overlay': 'rgba(2, 6, 23, 0.78)',
      '--body-background':
        'radial-gradient(900px 500px at 10% -5%, rgba(59, 130, 246, 0.25) 0%, transparent 55%), radial-gradient(800px 440px at 100% 10%, rgba(34, 211, 238, 0.12) 0%, transparent 52%), linear-gradient(180deg, #030508 0%, #050810 50%, #070b14 100%)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Negro puro · acentos blancos',
    swatch: ['#000000', '#ffffff', '#525252'],
    metaColor: '#000000',
    vars: {
      '--color-fg': '#fafafa',
      '--color-fg-muted': '#737373',
      '--color-chrome': '#fafafa',
      '--color-chrome-fg': '#0a0a0a',
      '--color-chrome-soft': '#d4d4d4',
      '--color-surface': '#000000',
      '--color-surface-elevated': '#0f0f0f',
      '--color-line': '#262626',
      '--color-brand': '#ffffff',
      '--color-brand-soft': '#171717',
      '--color-brand-strong': '#d4d4d4',
      '--color-accent': '#fafafa',
      '--color-accent-strong': '#d4d4d4',
      '--color-progress': '#a3a3a3',
      '--color-success-soft': '#14532d',
      '--color-progress-soft': '#1e293b',
      '--color-danger': '#ef4444',
      '--color-danger-strong': '#b91c1c',
      '--color-overlay': 'rgba(0, 0, 0, 0.82)',
      '--body-background':
        'radial-gradient(800px 400px at 50% -20%, rgba(255, 255, 255, 0.06) 0%, transparent 60%), linear-gradient(180deg, #000000 0%, #050505 100%)',
    },
  },
]

export const THEME_MAP = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemePreset>

export function isThemeId(value: string): value is ThemeId {
  return value in THEME_MAP
}
