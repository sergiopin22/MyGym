import { Button } from '../../components/Button'
import { useAuth } from '../../context/AuthProvider'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import type { WeightUnit } from '../../utils/weight'
import { consumePendingWeightOnboarding } from './LoginPage'

const OPTIONS: Array<{ id: WeightUnit; title: string; hint: string }> = [
  {
    id: 'lb',
    title: 'Libras (lb)',
    hint: 'EE.UU. — recomendado si ya entrenas en lb',
  },
  {
    id: 'kg',
    title: 'Kilogramos (kg)',
    hint: 'Colombia y la mayoría de Latinoamérica',
  },
]

/** Primera vez tras crear cuenta — la elección queda en ESA cuenta */
export function WeightUnitOnboarding() {
  const { user } = useAuth()
  const { unit, setUnit } = useWeightUnit()

  function confirm(next: WeightUnit) {
    setUnit(next)
    consumePendingWeightOnboarding()
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-[#070707] px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Preferencia de cuenta
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-fg">
            ¿Cómo quieres ver los pesos?
          </h1>
          <p className="mt-3 text-sm text-muted">
            {user?.email ? (
              <>
                Para <span className="font-semibold text-fg">{user.email}</span>.
              </>
            ) : null}{' '}
            Entrenamiento, PRs e historial usarán esta unidad. Se puede cambiar
            después en Ajustes.
          </p>
        </header>

        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const active = unit === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => confirm(opt.id)}
                className={[
                  'w-full rounded-2xl px-4 py-3.5 text-left ring-1 transition',
                  active
                    ? 'bg-chrome text-chrome-fg ring-chrome'
                    : 'bg-surface text-fg ring-line hover:bg-brand-soft',
                ].join(' ')}
              >
                <span className="block font-semibold">{opt.title}</span>
                <span
                  className={[
                    'mt-0.5 block text-sm',
                    active ? 'text-chrome-fg/80' : 'text-muted',
                  ].join(' ')}
                >
                  {opt.hint}
                </span>
              </button>
            )
          })}
        </div>

        <Button fullWidth onClick={() => confirm(unit)}>
          Continuar con {unit === 'kg' ? 'kilogramos' : 'libras'}
        </Button>
      </div>
    </div>
  )
}
