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

/** Grupos que el coach filtra: cada máquina debe tener uno de estos. */
export const MACHINE_MUSCLE_GROUPS = [
  'Pecho',
  'Hombros',
  'Tríceps',
  'Piernas',
  'Bíceps',
  'Espalda',
] as const

interface MuscleGroupPickerProps {
  value: string[]
  onChange: (next: string[]) => void
  groups?: readonly string[]
}

export function MuscleGroupPicker({
  value,
  onChange,
  groups = MUSCLE_PRESETS,
}: MuscleGroupPickerProps) {
  function toggle(group: string) {
    if (value.includes(group)) {
      onChange(value.filter((g) => g !== group))
    } else {
      onChange([...value, group])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => {
        const active = value.includes(group)
        return (
          <button
            key={group}
            type="button"
            onClick={() => toggle(group)}
            className={[
              'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
              active
                ? 'bg-chrome text-chrome-fg'
                : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
            ].join(' ')}
          >
            {group}
          </button>
        )
      })}
    </div>
  )
}
