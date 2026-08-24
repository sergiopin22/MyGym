/** Helpers de imagen/video por ejercicio — se expanden con la UI de rutinas */
export const DEFAULT_EXERCISE_IMAGE = '/exercises/default.svg'
export const MACHINE_EXERCISE_IMAGE = '/exercises/machine.svg'

export function openTutorial(videoUrl?: string) {
  if (!videoUrl) return
  window.open(videoUrl, '_blank', 'noopener,noreferrer')
}
