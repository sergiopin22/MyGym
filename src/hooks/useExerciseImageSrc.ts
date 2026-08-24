import { useEffect, useState } from 'react'
import { getExerciseImageObjectUrl } from '../db/repository'

/**
 * Resuelve la src de un ejercicio: blob custom en IndexedDB o imageUrl por defecto.
 * Revoca el object URL al desmontar / cambiar.
 */
export function useExerciseImageSrc(
  routineExerciseId: string | undefined,
  imageUrl: string,
  hasCustomImage?: boolean,
) {
  const [src, setSrc] = useState(imageUrl || '/exercises/default.svg')

  useEffect(() => {
    let alive = true
    let objectUrl: string | null = null

    async function load() {
      if (!routineExerciseId || !hasCustomImage) {
        if (alive) setSrc(imageUrl || '/exercises/default.svg')
        return
      }
      objectUrl = await getExerciseImageObjectUrl(routineExerciseId)
      if (!alive) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        return
      }
      if (objectUrl) setSrc(objectUrl)
      else setSrc(imageUrl || '/exercises/default.svg')
    }

    void load()

    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [routineExerciseId, imageUrl, hasCustomImage])

  return src
}
