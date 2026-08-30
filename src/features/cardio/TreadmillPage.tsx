import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { NumberStepper } from '../../components/NumberStepper'
import {
  getLatestTreadmillSession,
  listTreadmillSessions,
  saveTreadmillSession,
} from '../../db/repository'
import type { TreadmillSession } from '../../types'
import { formatTreadmillSummary } from '../../utils/treadmill'

export function TreadmillPage() {
  const navigate = useNavigate()
  const [speedMph, setSpeedMph] = useState<number | null>(null)
  const [inclinePercent, setInclinePercent] = useState<number | null>(0)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(0)
  const [calories, setCalories] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<TreadmillSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listTreadmillSessions(20)
      .then((rows) => {
        if (alive) setHistory(rows)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  function applyLast(session: TreadmillSession) {
    setSpeedMph(session.speedMph)
    setInclinePercent(session.inclinePercent)
    setDurationMinutes(session.durationMinutes)
    setDurationSeconds(session.durationSeconds)
    setCalories(session.calories)
    setError(null)
  }

  async function handleUseLast() {
    setError(null)
    try {
      const last = await getLatestTreadmillSession()
      if (!last) {
        setError('Aún no tienes registros de caminadora.')
        return
      }
      applyLast(last)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar')
    }
  }

  async function handleSave() {
    if (speedMph == null || durationMinutes == null || calories == null) {
      setError('Completa velocidad, tiempo y calorías.')
      return
    }
    setSaving(true)
    setError(null)
    setSavedFlash(null)
    try {
      const saved = await saveTreadmillSession({
        speedMph,
        inclinePercent: inclinePercent ?? 0,
        durationMinutes,
        durationSeconds: durationSeconds ?? 0,
        calories,
        note,
      })
      setHistory((prev) => [saved, ...prev.filter((h) => h.id !== saved.id)])
      setSavedFlash('Registro guardado')
      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="shrink-0 space-y-2 border-b border-line py-3">
        <Link to="/" className="text-sm font-semibold text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Caminadora
        </h1>
        <p className="text-sm text-muted">
          Cardio aparte — no cuenta para la meta de constancia.
        </p>
        <Button
          variant="secondary"
          className="min-h-11 w-full text-sm"
          onClick={() => void handleUseLast()}
        >
          Usar última sesión
        </Button>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <Card className="space-y-4">
          <NumberStepper
            label="Velocidad"
            suffix="mph"
            step={0.1}
            min={0}
            value={speedMph}
            onChange={setSpeedMph}
          />
          <NumberStepper
            label="Inclinación"
            suffix="%"
            step={0.5}
            min={0}
            max={30}
            value={inclinePercent}
            onChange={setInclinePercent}
          />
          <NumberStepper
            label="Minutos"
            suffix="min"
            step={1}
            min={0}
            value={durationMinutes}
            onChange={setDurationMinutes}
          />
          <NumberStepper
            label="Segundos"
            suffix="s"
            step={1}
            min={0}
            max={59}
            value={durationSeconds}
            onChange={(v) => setDurationSeconds(v == null ? 0 : Math.min(59, v))}
          />
          <NumberStepper
            label="Calorías"
            suffix="kcal"
            step={1}
            min={0}
            value={calories}
            onChange={setCalories}
          />
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Nota (opcional)
            </span>
            <textarea
              value={note}
              rows={2}
              maxLength={200}
              placeholder="Ej. post-pierna, intervalos suaves…"
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/25"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </Card>

        {savedFlash ? (
          <p className="mt-3 rounded-2xl bg-success-soft px-3 py-2 text-sm font-semibold text-accent-strong">
            {savedFlash}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm font-medium text-danger">{error}</p>
        ) : null}

        <div className="mt-6 space-y-2">
          <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Guardando…' : 'Guardar caminadora'}
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
            Cancelar
          </Button>
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-bold">Recientes</h2>
          {loading ? (
            <p className="text-sm text-muted">Cargando…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted">Sin registros todavía.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl bg-surface-elevated px-3 py-3 ring-1 ring-line"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {new Date(row.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-medium text-fg">
                    {formatTreadmillSummary(row)}
                  </p>
                  {row.note ? (
                    <p className="mt-1 text-xs text-muted">{row.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
