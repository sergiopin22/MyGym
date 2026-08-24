import { useExerciseImageSrc } from '../hooks/useExerciseImageSrc'

interface ExerciseThumbProps {
  routineExerciseId: string
  name: string
  imageUrl: string
  hasCustomImage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
} as const

export function ExerciseThumb({
  routineExerciseId,
  name,
  imageUrl,
  hasCustomImage,
  size = 'md',
}: ExerciseThumbProps) {
  const src = useExerciseImageSrc(routineExerciseId, imageUrl, hasCustomImage)

  return (
    <img
      src={src}
      alt={name}
      className={[
        sizes[size],
        'shrink-0 rounded-2xl object-cover bg-ink-soft/10 ring-1 ring-line',
      ].join(' ')}
    />
  )
}
