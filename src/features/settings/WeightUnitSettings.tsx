import { Card } from '../../components/Card'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import type { WeightUnit } from '../../utils/weight'

const OPTIONS: Array<{ id: WeightUnit; title: string; hint: string }> = [
  { id: 'lb', title: 'Libras (lb)', hint: 'Como en EE.UU.' },
  { id: 'kg', title: 'Kilogramos (kg)', hint: 'Como en Colombia' },
]

export function WeightUnitSettings() {
  const { unit, setUnit } = useWeightUnit()

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">Unidad de peso</h2>
        <p className="mt-1 text-sm text-muted">
          Solo cambia cómo ves y escribes los pesos. El historial se convierte al
          mostrarlo; no pierdes marcas.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const active = unit === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setUnit(opt.id)}
              className={[
                'rounded-2xl px-3 py-3 text-left ring-1 transition',
                active
                  ? 'bg-chrome text-chrome-fg ring-chrome'
                  : 'bg-surface text-fg ring-line hover:bg-brand-soft',
              ].join(' ')}
            >
              <span className="block text-sm font-semibold">{opt.title}</span>
              <span
                className={[
                  'block text-xs',
                  active ? 'text-chrome-fg/75' : 'text-muted',
                ].join(' ')}
              >
                {opt.hint}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
