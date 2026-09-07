/**
 * Inventario de sync Mi Gym → Supabase
 * Fuente de verdad local: Dexie + localStorage
 * Nube: Postgres (tablas) + Storage (archivos)
 */

export const SUPABASE_SYNC_INVENTORY = {
  /** Se guarda tal cual (o como JSONB) */
  tables: [
    {
      local: 'routines',
      cloud: 'routines',
      includes: [
        'días',
        'ejercicios',
        'máquinas alternativas',
        'agarres',
        'mantenimiento',
        'videoUrl',
        'flags de imagen custom',
      ],
    },
    {
      local: 'sessions',
      cloud: 'workout_sessions',
      includes: [
        'historial completo',
        'series (peso/reps/RIR/straps)',
        'alternativa usada ese día',
        'agarre usado',
        'notas',
        'recuperación de días',
        'fechas → llenan el heatmap Gym',
      ],
      note: 'PRs y cuadritos se calculan desde aquí; no hace falta tabla aparte',
    },
    {
      local: 'constancyGoals',
      cloud: 'constancy_goals',
      includes: [
        'progreso current/target',
        'premio',
        'fallos netos',
        'penitencia',
        'claves de semana (recovery/reset/penance)',
        'días evaluados',
      ],
    },
    {
      local: 'treadmillSessions',
      cloud: 'treadmill_sessions',
      includes: ['velocidad', 'inclinación', 'tiempo', 'calorías', 'nota'],
    },
    {
      local: 'improvements',
      cloud: 'improvements',
      includes: ['mejoras de peso/reps detectadas'],
    },
    {
      local: 'bodyCheckIns',
      cloud: 'body_check_ins',
      includes: ['peso', 'medidas', 'nota'],
    },
    {
      local: 'localStorage prefs',
      cloud: 'user_preferences',
      includes: [
        'themeId',
        'uiLayout (classic/focus)',
        'focusAccent',
        'brandAvatarId',
        'avatarMode (preset/custom)',
      ],
    },
  ],
  /** Archivos en Storage + fila en media_assets */
  media: [
    { local: 'customAvatarGifs', cloud: 'avatar_gif', path: '{userId}/avatar.gif' },
    {
      local: 'exerciseImages',
      cloud: 'exercise_image',
      path: '{userId}/exercises/{exerciseId}',
    },
    {
      local: 'bodyCheckInPhotos',
      cloud: 'body_photo',
      path: '{userId}/body/{checkInId}/{angle}',
    },
  ],
  /** No se guardan aparte: se derivan */
  derived: [
    'PRs (desde sesiones completadas)',
    'Heatmap / cuadritos Gym (desde fechas de sesiones completed)',
    'Progreso del día Hoy % (desde sesión del día)',
  ],
} as const
