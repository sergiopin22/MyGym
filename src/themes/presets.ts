export type ThemeId =
  | 'classic'
  | 'underground-red'
  | 'underground-blue'
  | 'midnight'
  | 'ippo'
  | 'asta'
  | 'temach'

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
    name: 'Óxido',
    tagline: 'Dark gym · naranja óxido · hollín',
    swatch: ['#0a0908', '#ea580c', '#ffedd5'],
    metaColor: '#0a0908',
    vars: {
      '--color-fg': '#ffedd5',
      '--color-fg-muted': '#a89886',
      '--color-chrome': '#ea580c',
      '--color-chrome-fg': '#140a04',
      '--color-chrome-soft': '#c2410c',
      '--color-surface': '#12100e',
      '--color-surface-elevated': '#1c1713',
      '--color-line': '#3a2e24',
      '--color-brand': '#ea580c',
      '--color-brand-soft': '#2f1a0e',
      '--color-brand-strong': '#fb923c',
      '--color-accent': '#ea580c',
      '--color-accent-strong': '#c2410c',
      '--color-accent-fg': '#fff7ed',
      '--color-progress': '#f97316',
      '--color-success-soft': '#2f1a0e',
      '--color-progress-soft': '#2a180c',
      '--color-danger': '#ef4444',
      '--color-danger-strong': '#dc2626',
      '--color-danger-fg': '#fff7ed',
      '--color-overlay': 'rgba(6, 4, 2, 0.82)',
      '--body-background':
        'radial-gradient(1100px 580px at 50% -18%, rgba(234,88,12,0.18) 0%, transparent 55%), radial-gradient(780px 460px at 100% 28%, rgba(90,30,8,0.38) 0%, transparent 52%), linear-gradient(180deg, #070605 0%, #0e0c0a 42%, #0a0908 100%)',
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
      '--color-accent-fg': '#ffffff',
      '--color-progress': '#f87171',
      '--color-success-soft': '#1f1515',
      '--color-progress-soft': '#1a1212',
      '--color-danger': '#991b1b',
      '--color-danger-strong': '#7f1d1d',
      '--color-danger-fg': '#ffffff',
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
      '--color-accent-fg': '#041016',
      '--color-progress': '#60a5fa',
      '--color-success-soft': '#0c1f1f',
      '--color-progress-soft': '#0f1a2e',
      '--color-danger': '#f87171',
      '--color-danger-strong': '#dc2626',
      '--color-danger-fg': '#0a0a0a',
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
      '--color-accent-strong': '#e5e5e5',
      '--color-accent-fg': '#0a0a0a',
      '--color-progress': '#a3a3a3',
      '--color-success-soft': '#14532d',
      '--color-progress-soft': '#1e293b',
      '--color-danger': '#ef4444',
      '--color-danger-strong': '#b91c1c',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(0, 0, 0, 0.82)',
      '--body-background':
        'radial-gradient(800px 400px at 50% -20%, rgba(255, 255, 255, 0.06) 0%, transparent 60%), linear-gradient(180deg, #000000 0%, #050505 100%)',
    },
  },
  {
    id: 'ippo',
    name: 'Ippo',
    tagline: 'Dark · ring · rojo Kamogawa',
    swatch: ['#0c0a0a', '#c41e3a', '#e8c39a'],
    metaColor: '#0c0a0a',
    vars: {
      '--color-fg': '#f5f0eb',
      '--color-fg-muted': '#a89a8c',
      '--color-chrome': '#c41e3a',
      '--color-chrome-fg': '#ffffff',
      '--color-chrome-soft': '#8b1528',
      '--color-surface': '#0c0a0a',
      '--color-surface-elevated': '#161210',
      '--color-line': '#2e221e',
      '--color-brand': '#c41e3a',
      '--color-brand-soft': '#1f0c10',
      '--color-brand-strong': '#9f1830',
      '--color-accent': '#d4a574',
      '--color-accent-strong': '#b8864e',
      '--color-accent-fg': '#0a0a0a',
      '--color-progress': '#e85a6e',
      '--color-success-soft': '#1a1410',
      '--color-progress-soft': '#1f1014',
      '--color-danger': '#991b1b',
      '--color-danger-strong': '#7f1d1d',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(0, 0, 0, 0.8)',
      '--body-background':
        'url("/themes/ippo-bg.svg") center top / cover no-repeat, radial-gradient(900px 480px at 50% -8%, rgba(196, 30, 58, 0.18) 0%, transparent 55%), radial-gradient(700px 400px at 50% 100%, rgba(180, 83, 9, 0.08) 0%, transparent 50%), linear-gradient(180deg, #080606 0%, #0c0a0a 50%, #12100e 100%)',
    },
  },
  {
    id: 'asta',
    name: 'Asta',
    tagline: 'Dark · anti-magic · verde fuerte',
    swatch: ['#050505', '#22c55e', '#4ade80'],
    metaColor: '#050505',
    vars: {
      '--color-fg': '#f0fdf4',
      '--color-fg-muted': '#86a894',
      '--color-chrome': '#22c55e',
      '--color-chrome-fg': '#052e16',
      '--color-chrome-soft': '#16a34a',
      '--color-surface': '#050505',
      '--color-surface-elevated': '#0c1210',
      '--color-line': '#1a2e22',
      '--color-brand': '#22c55e',
      '--color-brand-soft': '#0a1a12',
      '--color-brand-strong': '#16a34a',
      '--color-accent': '#4ade80',
      '--color-accent-strong': '#22c55e',
      '--color-accent-fg': '#052e16',
      '--color-progress': '#4ade80',
      '--color-success-soft': '#0a1a12',
      '--color-progress-soft': '#0c1a14',
      '--color-danger': '#ef4444',
      '--color-danger-strong': '#dc2626',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(0, 0, 0, 0.82)',
      '--body-background':
        'url("/themes/asta-bg.svg") center top / cover no-repeat, radial-gradient(900px 500px at 50% 30%, rgba(34, 197, 94, 0.18) 0%, transparent 55%), radial-gradient(700px 400px at 90% 90%, rgba(74, 222, 128, 0.1) 0%, transparent 50%), linear-gradient(180deg, #030503 0%, #050505 50%, #080c0a 100%)',
    },
  },
  {
    id: 'temach',
    name: 'Temach',
    tagline: 'Modo guerra · negro · rojo · blanco',
    swatch: ['#000000', '#e10600', '#ffffff'],
    metaColor: '#000000',
    vars: {
      '--color-fg': '#ffffff',
      '--color-fg-muted': '#8a8a8a',
      '--color-chrome': '#ffffff',
      '--color-chrome-fg': '#0a0a0a',
      '--color-chrome-soft': '#e5e5e5',
      '--color-surface': '#000000',
      '--color-surface-elevated': '#111111',
      '--color-line': '#2a2a2a',
      '--color-brand': '#e10600',
      '--color-brand-soft': '#1a0808',
      '--color-brand-strong': '#b90500',
      '--color-accent': '#e10600',
      '--color-accent-strong': '#991b1b',
      '--color-accent-fg': '#ffffff',
      '--color-progress': '#ff4444',
      '--color-success-soft': '#1a0a0a',
      '--color-progress-soft': '#1f0a0a',
      '--color-danger': '#ef4444',
      '--color-danger-strong': '#b91c1c',
      '--color-danger-fg': '#ffffff',
      '--color-overlay': 'rgba(0, 0, 0, 0.85)',
      '--body-background':
        'url("/themes/temach-bg.svg") center top / cover no-repeat, radial-gradient(900px 480px at 50% -5%, rgba(225, 6, 0, 0.2) 0%, transparent 55%), radial-gradient(700px 400px at 100% 100%, rgba(127, 29, 29, 0.12) 0%, transparent 50%), linear-gradient(180deg, #000000 0%, #050505 50%, #0a0a0a 100%)',
    },
  },
]

export const THEME_MAP = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemePreset>

export function isThemeId(value: string): value is ThemeId {
  return value in THEME_MAP
}
