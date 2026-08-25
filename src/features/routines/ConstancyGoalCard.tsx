import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { NumberStepper } from '../../components/NumberStepper'
import { ProgressBar } from '../../components/ProgressBar'
import {
  acknowledgePenance,
  abandonConstancyGoal,
  canUseRecoveryThisWeek,
  createConstancyGoal,
  getActiveConstancyGoal,
  getLatestConstancyGoal,
  getPenanceStatus,
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
  'Si fallas 1 día de gym en la semana, no pasa nada.',
  'Si fallas 2 días netos en la semana (sin recuperar), el domingo a las 23:59 debes donar $30 USD a Helen (penitencia).',
  'Todo el domingo puedes recuperar 1 día; la penitencia solo se aplica después de las 23:59 (o el lunes).',
  'Si fallas 3 días netos en la misma semana, el progreso de la meta vuelve a 0.',
  'Los días de descanso no cuentan como fallo.',
  'Sábado o domingo puedes recuperar 1 día perdido (máx. una vez). Ese día deja de contar como fallo.',
  'Ejemplo: fallaste 2 y recuperaste 1 el domingo → solo fallaste 1 → no hay penitencia ni reinicio.',
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
  const [penance, setPenance] = useState<{
    owed: boolean
    netMisses: number
    missedLabels: string[]
    penanceLabel: string
    acknowledged: boolean
  } | null>(null)

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
      const [missed, ok, pen] = await Promise.all([
        getRecoverableMissedDays(),
        canUseRecoveryThisWeek(),
        getPenanceStatus(),
      ])
      setMissedDays(missed)
      setCanRecover(ok)
      setPenance(pen)
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
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la meta')
    } finally {
      setSaving(false)
    }
  }

  async function handleAckPenance() {
    await acknowledgePenance()
    await reload()
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
  const showPenance =
    Boolean(active) && penance?.owed && !penance.acknowledged

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

      {showPenance ? (
        <div className="space-y-2 rounded-2xl bg-danger/15 px-3 py-3 ring-1 ring-danger">
          <p className="font-display text-base font-bold text-danger">
            Penitencia de la semana
          </p>
          <p className="text-sm text-fg">
            Fallaste {penance!.netMisses} día(s) netos
            {penance!.missedLabels.length
              ? ` (${penance!.missedLabels.join(', ')})`
              : ''}
            . Tocó cumplir: <strong>{penance!.penanceLabel}</strong>
          </p>
          <Button fullWidth variant="danger" onClick={() => void handleAckPenance()}>
            Ya cumplí la penitencia
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
            Fallos netos esta semana: {active.consecutiveMisses}/3 (con 3 se
            reinicia · con 2 sin recuperar → donar $30 a Helen el domingo 23:59)
          </p>
          <p className="text-xs text-muted">
            Penitencia: {active.penanceLabel ?? 'Donar $30 USD a Helen'}
          </p>
          {canRecover && missedDays.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-brand-soft px-3 py-3">
              <p className="text-sm font-semibold text-fg">
                Recuperar día perdido (fin de semana)
              </p>
              <p className="text-xs text-muted">
                Elige el día que te faltó. Si recuperas 1 de 2 fallos, te salvas
                de la penitencia.
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
          <p className="text-xs text-muted">
            Penitencia por defecto si fallas 2 días netos: donar $30 USD a Helen
            (se aplica el domingo a las 23:59, así puedes recuperar antes).
          </p>
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
