export const MUSCLE_PRESETS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Piernas',
  'Glúteos',
  'Core',
  'Cardio',
] as const

interface MuscleGroupPickerProps {
  value: string[]
  onChange: (next: string[]) => void
}

export function MuscleGroupPicker({ value, onChange }: MuscleGroupPickerProps) {
  function toggle(group: string) {
    if (value.includes(group)) {
      onChange(value.filter((g) => g !== group))
    } else {
      onChange([...value, group])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_PRESETS.map((group) => {
        const active = value.includes(group)
        return (
          <button
            key={group}
            type="button"
            onClick={() => toggle(group)}
            className={[
              'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
              active
                ? 'bg-ink text-white'
                : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
            ].join(' ')}
          >
            {group}
          </button>
        )
      })}
    </div>
  )
}
