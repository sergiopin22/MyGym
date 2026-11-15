import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getWeeklyMachineSummary } from '../../db/repository'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import {
  addDaysISO,
  formatShortDateEs,
  parseISODate,
  startOfWeekMonday,
  todayISODate,
} from '../../utils/id'
import { copyToClipboard } from '../../utils/clipboard'
import {
  formatSetShort,
  formatWeeklySummaryForCoach,
  statusLabelEs,
  type WeeklyMachineRow,
  type WeeklyMachineStatus,
  type WeeklyMachineSummary,
} from '../../utils/weeklySummary'
import { dismissWeeklyBanner } from '../../utils/weeklyBanner'
import { PageHeader } from '../../ui/PageHeader'

type Stage = 'counts' | 'champion' | 'list'

function statusClass(status: WeeklyMachineStatus): string {
  switch (status) {
    case 'up':
    case 'new':
      return 'weekly-row--up'
    case 'down':
      return 'weekly-row--down'
    case 'same':
      return 'weekly-row--same'
    default:
      return 'weekly-row--muted'
  }
}

function statusMark(status: WeeklyMachineStatus): string {
  switch (status) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    case 'same':
      return '='
    case 'new':
      return '★'
    default:
      return '·'
  }
}

function CountUp({ value, active }: { value: number; active: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) {
      setN(0)
      return
    }
    if (value <= 0) {
      setN(0)
      return
    }
    let frame = 0
    const steps = Math.min(16, value)
    const id = window.setInterval(() => {
      frame += 1
      setN(Math.round((value * frame) / steps))
      if (frame >= steps) window.clearInterval(id)
    }, 40)
    return () => window.clearInterval(id)
  }, [value, active])
  return <span>{n}</span>
}

export function WeeklySummaryPage() {
  const { unit } = useWeightUnit()
  const [searchParams] = useSearchParams()
  const thisMonday = useMemo(
    () => todayISODate(startOfWeekMonday()),
    [],
  )
  const initialWeek = useMemo(() => {
    const raw = searchParams.get('semana')
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const monday = todayISODate(startOfWeekMonday(parseISODate(raw)))
      if (monday <= thisMonday) return monday
    }
    return thisMonday
  }, [searchParams, thisMonday])
  const [weekStart, setWeekStart] = useState(initialWeek)
  const [summary, setSummary] = useState<WeeklyMachineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('counts')
  const [copyDone, setCopyDone] = useState(false)
  const [copyBusy, setCopyBusy] = useState(false)

  useEffect(() => {
    dismissWeeklyBanner(weekStart)
  }, [weekStart])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setStage('counts')
    getWeeklyMachineSummary(weekStart)
      .then((data) => {
        if (!alive) return
        setSummary(data)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setSummary(null)
        setError(err instanceof Error ? err.message : 'No se pudo armar')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [weekStart])

  useEffect(() => {
    if (!summary || loading) return
    const t1 = window.setTimeout(() => setStage('champion'), 700)
    const t2 = window.setTimeout(() => setStage('list'), 1400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [summary, loading, weekStart])

  async function handleCopy() {
    if (!summary) return
    setCopyBusy(true)
    try {
      await copyToClipboard(formatWeeklySummaryForCoach(summary, unit))
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo copiar')
    } finally {
      setCopyBusy(false)
    }
  }

  function shiftWeek(delta: number) {
    const next = addDaysISO(weekStart, delta * 7)
    if (next > thisMonday) return
    setWeekStart(next)
  }

  const canGoNext = weekStart < thisMonday

  return (
    <div className="weekly-summary-page space-y-5">
      <PageHeader
        kicker="Focus · Semana"
        title="Resumen semanal"
        subtitle="Todas tus máquinas: esta semana vs la anterior. Datos reales."
        back={
          <Link
            to="/historial"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← Historial
          </Link>
        }
      />

      <div className="weekly-week-nav">
        <button
          type="button"
          className="weekly-week-nav__btn"
          onClick={() => shiftWeek(-1)}
          aria-label="Semana anterior"
        >
          ←
        </button>
        <div className="weekly-week-nav__label">
          <p className="weekly-week-nav__range">
            {formatShortDateEs(weekStart)} –{' '}
            {formatShortDateEs(addDaysISO(weekStart, 6))}
          </p>
          <p className="weekly-week-nav__vs">
            vs {formatShortDateEs(addDaysISO(weekStart, -7))} –{' '}
            {formatShortDateEs(addDaysISO(weekStart, -1))}
          </p>
        </div>
        <button
          type="button"
          className="weekly-week-nav__btn"
          disabled={!canGoNext}
          onClick={() => shiftWeek(1)}
          aria-label="Semana siguiente"
        >
          →
        </button>
      </div>

      {loading ? <p className="text-sm text-muted">Armando resumen…</p> : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      {summary && !loading ? (
        <>
          <div
            className={[
              'weekly-counts',
              stage === 'counts' || stage === 'champion' || stage === 'list'
                ? 'weekly-counts--in'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="weekly-counts__item weekly-counts__item--up">
              <p className="weekly-counts__n">
                <CountUp value={summary.counts.up} active />
              </p>
              <p className="weekly-counts__l">Subieron</p>
            </div>
            <div className="weekly-counts__item weekly-counts__item--same">
              <p className="weekly-counts__n">
                <CountUp value={summary.counts.same} active />
              </p>
              <p className="weekly-counts__l">Igual</p>
            </div>
            <div className="weekly-counts__item weekly-counts__item--down">
              <p className="weekly-counts__n">
                <CountUp value={summary.counts.down} active />
              </p>
              <p className="weekly-counts__l">Bajaron</p>
            </div>
            <div className="weekly-counts__item weekly-counts__item--muted">
              <p className="weekly-counts__n">
                <CountUp
                  value={summary.counts.noData + summary.counts.new}
                  active
                />
              </p>
              <p className="weekly-counts__l">Otros</p>
            </div>
          </div>

          {summary.champion &&
          (stage === 'champion' || stage === 'list') ? (
            <div className="weekly-champion">
              <p className="weekly-champion__crown" aria-hidden>
                👑
              </p>
              <p className="weekly-champion__kicker">Campeón de la semana</p>
              <p className="weekly-champion__name">{summary.champion.name}</p>
              <p className="weekly-champion__sets">
                {formatSetShort(summary.champion.previous, unit)}
                <span aria-hidden> → </span>
                {formatSetShort(summary.champion.current, unit)}
              </p>
            </div>
          ) : null}

          {stage === 'list' ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Todas las máquinas
              </p>
              <ul className="weekly-list">
                {summary.rows.map((row, i) => (
                  <MachineRow
                    key={row.key}
                    row={row}
                    unit={unit}
                    delayMs={Math.min(i * 35, 500)}
                    isChampion={summary.champion?.key === row.key}
                  />
                ))}
              </ul>

              {summary.rows.length === 0 ? (
                <p className="text-sm text-muted">
                  Aún no hay máquinas en la rutina ni series esta semana.
                </p>
              ) : null}

              <Button
                fullWidth
                disabled={copyBusy}
                onClick={() => void handleCopy()}
              >
                {copyDone
                  ? '¡Copiado!'
                  : copyBusy
                    ? 'Copiando…'
                    : 'Copiar para mi coach'}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function MachineRow({
  row,
  unit,
  delayMs,
  isChampion,
}: {
  row: WeeklyMachineRow
  unit: 'lb' | 'kg'
  delayMs: number
  isChampion?: boolean
}) {
  return (
    <li
      className={[
        'weekly-row',
        statusClass(row.status),
        isChampion ? 'weekly-row--champion' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="weekly-row__top">
        <span className="weekly-row__mark" aria-hidden>
          {isChampion ? '👑' : statusMark(row.status)}
        </span>
        <span className="weekly-row__name">{row.name}</span>
        <span className="weekly-row__status">
          {isChampion ? 'Campeón' : statusLabelEs(row.status)}
        </span>
      </div>
      <p className="weekly-row__sets">
        {row.status === 'no_data' && !row.current && !row.previous
          ? 'Sin series esta semana ni la anterior'
          : row.status === 'no_data' && row.previous && !row.current
            ? `No se hizo · antes ${formatSetShort(row.previous, unit)}`
            : row.status === 'new'
              ? `${formatSetShort(row.current, unit)} · sin semana previa`
              : `${formatSetShort(row.previous, unit)} → ${formatSetShort(row.current, unit)}`}
      </p>
    </li>
  )
}
