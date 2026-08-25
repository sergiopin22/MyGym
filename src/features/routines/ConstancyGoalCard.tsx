import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { NumberStepper } from '../../components/NumberStepper'
import { ProgressBar } from '../../components/ProgressBar'
import {
  abandonConstancyGoal,
  canUseRecoveryThisWeek,
  createConstancyGoal,
  getActiveConstancyGoal,
  getLatestConstancyGoal,
  getRecoverableMissedDays,
} from '../../db/repository'
import {
  PRIZE_PRESETS,
  type ConstancyGoal,
  type PrizePresetId,
  type RoutineDay,
} from '../../types'
import { weekdayLabel } from '../../utils/id'

const RULES = [
  'Cada entrenamiento que finalices suma +1 a tu meta.',
  'Si fallas 1 día de gym, no pasa nada: la meta sigue.',
  'Si fallas 2 días de gym seguidos, el progreso vuelve a 0.',
  'Los días de descanso no cuentan como fallo.',
  'Sábado o domingo puedes recuperar 1 día perdido de la semana (máximo una vez).',
  'Al recuperar, haces la rutina de ese día (máquinas, series, RIR) y cuenta para la meta.',
]

interface ConstancyGoalCardProps {
  /** Día elegido para recuperar → Inicio muestra su rutina y el botón empezar */
  onSelectRecoveryDay?: (day: RoutineDay) => void
  recoveryDayId?: string | null
  onClearRecovery?: () => void
  refreshKey?: number
}

export function ConstancyGoalCard({
  onSelectRecoveryDay,
  recoveryDayId,
  onClearRecovery,
  refreshKey = 0,
}: ConstancyGoalCardProps) {
  const [goal, setGoal] = useState<ConstancyGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'view' | 'create' | 'rules'>('view')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [targetCount, setTargetCount] = useState(30)
  const [prizePreset, setPrizePreset] = useState<PrizePresetId>('pork_roll')
  const [customPrize, setCustomPrize] = useState('')

  const [missedDays, setMissedDays] = useState<RoutineDay[]>([])
  const [canRecover, setCanRecover] = useState(false)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const active = await getActiveConstancyGoal()
      if (active) {
        setGoal(active)
      } else {
        const latest = await getLatestConstancyGoal()
        setGoal(latest ?? null)
      }
      const [missed, ok] = await Promise.all([
        getRecoverableMissedDays(),
        canUseRecoveryThisWeek(),
      ])
      setMissedDays(missed)
      setCanRecover(ok)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la meta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [refreshKey])

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      if (goal?.status === 'active') {
        await abandonConstancyGoal()
      }
      const label =
        prizePreset === 'custom'
          ? customPrize.trim()
          : PRIZE_PRESETS.find((p) => p.id === prizePreset)?.label ?? ''
      const created = await createConstancyGoal({
        targetCount,
        prizePreset,
        prizeLabel: label,
      })
      setGoal(created)
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la meta')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-surface-elevated px-4 py-4 text-sm text-muted">
        Cargando meta de constancia…
      </div>
    )
  }

  const active = goal?.status === 'active' ? goal : null
  const justCompleted = goal?.status === 'completed' ? goal : null

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            Meta de constancia
          </p>
          {active ? (
            <p className="mt-1 font-display text-xl font-extrabold text-fg">
              {active.currentCount} / {active.targetCount}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Crea una meta y gánate un premio por ir al gym.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'rules' ? 'view' : 'rules'))}
          className="shrink-0 rounded-xl bg-brand-soft px-3 py-2 text-xs font-bold text-fg"
        >
          Instrucciones
        </button>
      </div>

      {mode === 'rules' ? (
        <div className="space-y-2 rounded-2xl bg-surface px-3 py-3">
          <h3 className="font-display text-base font-bold text-fg">Instrucciones</h3>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <Button fullWidth variant="secondary" onClick={() => setMode('view')}>
            Entendido
          </Button>
        </div>
      ) : null}

      {mode === 'view' && active ? (
        <div className="space-y-3">
          <ProgressBar
            value={active.currentCount}
            max={active.targetCount}
            label={`Progreso · premio: ${active.prizeLabel}`}
          />
          <p className="text-xs text-muted">
            Fallos seguidos de gym: {active.consecutiveMisses}/2 (con 2 se reinicia)
          </p>
          {canRecover && missedDays.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-brand-soft px-3 py-3">
              <p className="text-sm font-semibold text-fg">
                Recuperar día perdido (fin de semana)
              </p>
              <p className="text-xs text-muted">
                Elige el día que te faltó. Verás su rutina y el botón para empezar.
              </p>
              <div className="flex flex-wrap gap-2">
                {missedDays.map((day) => {
                  const selected = recoveryDayId === day.id
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() =>
                        selected
                          ? onClearRecovery?.()
                          : onSelectRecoveryDay?.(day)
                      }
                      className={[
                        'min-h-11 rounded-xl px-3 text-sm font-semibold ring-1 transition',
                        selected
                          ? 'bg-chrome text-chrome-fg ring-chrome'
                          : 'bg-surface text-fg ring-line',
                      ].join(' ')}
                    >
                      {weekdayLabel(day.weekday)}
                      {selected ? ' · seleccionado' : ''}
                    </button>
                  )
                })}
              </div>
              {recoveryDayId ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand underline"
                  onClick={() => onClearRecovery?.()}
                >
                  Cancelar recuperación
                </button>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            className="text-xs font-semibold text-muted underline"
            onClick={() => setMode('create')}
          >
            Reiniciar / nueva meta
          </button>
        </div>
      ) : null}

      {mode === 'view' && !active && justCompleted ? (
        <div className="space-y-2 rounded-2xl bg-success-soft px-3 py-3">
          <p className="font-display text-base font-bold text-accent-strong">
            ¡Meta cumplida!
          </p>
          <p className="text-sm text-fg">
            Premio: {justCompleted.prizeLabel}. ¡A disfrutarlo!
          </p>
          <Button fullWidth onClick={() => setMode('create')}>
            Crear nueva meta
          </Button>
        </div>
      ) : null}

      {mode === 'view' && !active && !justCompleted ? (
        <Button fullWidth onClick={() => setMode('create')}>
          Crear meta de constancia
        </Button>
      ) : null}

      {/* Recuperación sin meta activa (solo fin de semana) */}
      {mode === 'view' && !active && canRecover && missedDays.length > 0 ? (
        <div className="space-y-2 rounded-2xl bg-brand-soft px-3 py-3">
          <p className="text-sm font-semibold text-fg">Recuperar día perdido</p>
          <div className="flex flex-wrap gap-2">
            {missedDays.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectRecoveryDay?.(day)}
                className="min-h-11 rounded-xl bg-surface px-3 text-sm font-semibold text-fg ring-1 ring-line"
              >
                {weekdayLabel(day.weekday)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {mode === 'create' ? (
        <div className="space-y-4">
          <NumberStepper
            label="¿Cuántos entrenamientos?"
            value={targetCount}
            min={1}
            max={365}
            allowEmpty={false}
            onChange={(v) => setTargetCount(v ?? 30)}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-fg">¿Cuál es el premio?</p>
            <div className="space-y-2">
              {PRIZE_PRESETS.map((p) => (
                <label
                  key={p.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 ring-1',
                    prizePreset === p.id
                      ? 'bg-brand-soft ring-brand'
                      : 'bg-surface ring-line',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="prize"
                    className="mt-1"
                    checked={prizePreset === p.id}
                    onChange={() => setPrizePreset(p.id)}
                  />
                  <span className="text-sm text-fg">{p.label}</span>
                </label>
              ))}
              <label
                className={[
                  'flex cursor-pointer flex-col gap-2 rounded-2xl px-3 py-3 ring-1',
                  prizePreset === 'custom'
                    ? 'bg-brand-soft ring-brand'
                    : 'bg-surface ring-line',
                ].join(' ')}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="prize"
                    checked={prizePreset === 'custom'}
                    onChange={() => setPrizePreset('custom')}
                  />
                  <span className="text-sm font-semibold text-fg">Personalizado</span>
                </span>
                {prizePreset === 'custom' ? (
                  <input
                    type="text"
                    value={customPrize}
                    onChange={(e) => setCustomPrize(e.target.value)}
                    placeholder="Escribe tu premio…"
                    className="min-h-11 w-full rounded-xl border border-line bg-surface-elevated px-3 text-sm text-fg"
                  />
                ) : null}
              </label>
            </div>
          </div>
          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setMode('view')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button fullWidth onClick={() => void handleCreate()} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar meta'}
            </Button>
          </div>
        </div>
      ) : null}

      {error && mode !== 'create' ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}
    </div>
  )
}
