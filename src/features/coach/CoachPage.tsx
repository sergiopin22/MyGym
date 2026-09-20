import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/Card'
import { StatusBadge } from '../../components/StatusBadge'
import type {
  CoachMachineSession,
  CoachMachineSummary,
  ExercisePR,
} from '../../db/repository'
import { PageHeader } from '../../ui/PageHeader'
import { useAuth } from '../../context/AuthProvider'
import { useTheme } from '../../context/ThemeProvider'
import { useWeightUnit } from '../../context/WeightUnitProvider'
import { formatStrapsLabel, formatStrapsSuffix } from '../../utils/straps'
import {
  formatWeight,
  formatWeightPair,
  type WeightUnit,
} from '../../utils/weight'
import {
  buildCoachSharePayload,
  fetchCoachSharePayload,
  historyKey,
  type CoachSharePayload,
} from './coachShare'
import { CoachShareBar } from './CoachShareBar'

type CoachTab = 'machines' | 'prs'

function formatCoachDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrLine(pr: ExercisePR, unit: WeightUnit): string {
  const rir = pr.rir != null ? ` · RIR ${pr.rir}` : ''
  return `${formatWeightPair(pr.weight, pr.reps, unit)}${rir}`
}

function prMachineName(pr: ExercisePR): string {
  if (!pr.gripName) return pr.exerciseName
  const suffix = ` · ${pr.gripName}`
  if (!pr.exerciseName.endsWith(suffix)) return pr.exerciseName
  return pr.exerciseName.slice(0, -suffix.length).trim()
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = foldName(query)
  if (!q) return true
  return foldName(haystack).includes(q)
}

function foldName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function sessionCountLabel(count: number): string {
  return count === 1 ? '1 entreno' : `${count} entrenos`
}

export function CoachPage() {
  const { token } = useParams<{ token?: string }>()
  const isPublic = Boolean(token)
  const { user } = useAuth()
  const { uiLayout } = useTheme()
  const { unit: localUnit } = useWeightUnit()
  const isFocus = uiLayout === 'focus'
  const [tab, setTab] = useState<CoachTab>('machines')
  const [query, setQuery] = useState('')
  const [payload, setPayload] = useState<CoachSharePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const unit = payload?.unit ?? localUnit
  const format = (lb: number | null | undefined) => formatWeight(lb, unit)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadError(null)
    const job = token
      ? fetchCoachSharePayload(token)
      : buildCoachSharePayload(user?.id)
    job
      .then((next) => {
        if (!alive) return
        setPayload(next)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setPayload(null)
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar la vista coach',
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [token, user?.id])

  const machines = payload?.machines ?? []
  const prs = payload?.prs ?? []
  const history =
    selectedName && payload
      ? (payload.historyByMachine[historyKey(selectedName)] ?? [])
      : []

  const filteredMachines = useMemo(
    () => machines.filter((row) => matchesQuery(row.name, query)),
    [machines, query],
  )

  const filteredPrs = useMemo(
    () =>
      prs.filter((pr) =>
        matchesQuery(
          `${pr.exerciseName} ${pr.gripName ?? ''} ${pr.withStraps ? 'straps' : ''}`,
          query,
        ),
      ),
    [prs, query],
  )

  const selectedMachine = machines.find(
    (row) => foldName(row.name) === foldName(selectedName ?? ''),
  )

  function openMachine(name: string) {
    setSelectedName(name)
    setQuery('')
  }

  const tabBar = (
    <div
      className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line"
      role="tablist"
      aria-label="Vista coach"
    >
      {(
        [
          { id: 'machines', label: 'Máquinas' },
          { id: 'prs', label: 'PRs' },
        ] as const
      ).map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => setTab(item.id)}
          className={[
            'min-h-11 rounded-xl text-sm font-bold transition',
            tab === item.id
              ? 'bg-chrome text-chrome-fg'
              : 'text-muted hover:bg-brand-soft hover:text-fg',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  const search = (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={
        tab === 'prs' ? 'Buscar PR o máquina…' : 'Filtrar por máquina…'
      }
      className="input-ios-safe min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
    />
  )

  return (
    <div className="app-safe-top mx-auto flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden px-4 lg:max-w-3xl">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
        {selectedName ? (
          <MachineHistoryView
            name={selectedName}
            machine={selectedMachine}
            history={history}
            loading={false}
            unit={unit}
            format={format}
            isFocus={isFocus}
            onBack={() => setSelectedName(null)}
          />
        ) : (
          <>
            <PageHeader
              kicker="Focus · Coach"
              title={isPublic ? 'Historial del atleta' : 'Vista coach'}
              subtitle={
                isPublic
                  ? 'Solo lectura. Filtra por máquina o mira todos los PRs.'
                  : 'Crea un enlace para tu coach. Él lo abre en su celular, sin cuenta.'
              }
              back={
                isPublic ? undefined : (
                  <Link
                    to="/"
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
                  >
                    ← Salir
                  </Link>
                )
              }
            />

            {isPublic ? null : <CoachShareBar />}

            {loadError ? (
              <p className="mt-4 rounded-2xl bg-surface px-3 py-3 text-sm font-medium text-danger ring-1 ring-line">
                {loadError}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {tabBar}
              {search}
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-muted">Cargando…</p>
            ) : tab === 'machines' ? (
              <MachineList
                rows={filteredMachines}
                empty={
                  machines.length === 0
                    ? 'Aún no hay entrenos completados para mostrar.'
                    : 'Ninguna máquina con ese nombre.'
                }
                unit={unit}
                onOpen={openMachine}
              />
            ) : (
              <PrList
                rows={filteredPrs}
                empty={
                  prs.length === 0
                    ? 'Todavía no hay PRs registrados.'
                    : 'Ningún PR con ese nombre.'
                }
                unit={unit}
                onOpen={openMachine}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MachineList({
  rows,
  empty,
  unit,
  onOpen,
}: {
  rows: CoachMachineSummary[]
  empty: string
  unit: WeightUnit
  onOpen: (name: string) => void
}) {
  if (rows.length === 0) {
    return (
      <Card className="mt-4">
        <p className="text-sm text-muted">{empty}</p>
      </Card>
    )
  }

  return (
    <ul className="mt-4 space-y-2">
      {rows.map((row) => {
        const best = row.pr && row.prWithStraps
          ? row.pr.weight >= row.prWithStraps.weight
            ? row.pr
            : row.prWithStraps
          : (row.pr ?? row.prWithStraps)
        return (
          <li key={row.name}>
            <button
              type="button"
              onClick={() => onOpen(row.name)}
              className="w-full rounded-3xl border border-line bg-surface-elevated p-4 text-left shadow-[0_10px_30px_-20px_rgba(12,26,20,0.45)] transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-fg">
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {sessionCountLabel(row.sessionCount)} · último{' '}
                    {formatCoachDate(row.lastDate)}
                  </p>
                </div>
                {best ? (
                  <span className="shrink-0 text-lg" aria-hidden>
                    🏆
                  </span>
                ) : null}
              </div>
              {best ? (
                <p className="mt-2 text-sm font-semibold text-fg">
                  PR {formatPrLine(best, unit)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin PR todavía</p>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PrList({
  rows,
  empty,
  unit,
  onOpen,
}: {
  rows: ExercisePR[]
  empty: string
  unit: WeightUnit
  onOpen: (name: string) => void
}) {
  if (rows.length === 0) {
    return (
      <Card className="mt-4">
        <p className="text-sm text-muted">{empty}</p>
      </Card>
    )
  }

  return (
    <ul className="mt-4 space-y-2">
      {rows.map((pr) => (
        <li key={`${pr.exerciseName}-${pr.withStraps ? 's' : 'f'}-${pr.sessionId}`}>
          <button
            type="button"
            onClick={() => onOpen(prMachineName(pr))}
            className="w-full rounded-3xl border border-line bg-surface-elevated p-4 text-left shadow-[0_10px_30px_-20px_rgba(12,26,20,0.45)] transition active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl" aria-hidden>
                🏆
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-fg">
                  {pr.exerciseName}
                </p>
                <p className="mt-1 text-sm font-semibold text-fg">
                  {formatPrLine(pr, unit)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatCoachDate(pr.date)}
                  {pr.withStraps ? ` · ${formatStrapsLabel(true)}` : ''}
                </p>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function MachineHistoryView({
  name,
  machine,
  history,
  loading,
  unit,
  format,
  isFocus,
  onBack,
}: {
  name: string
  machine?: CoachMachineSummary
  history: CoachMachineSession[]
  loading: boolean
  unit: WeightUnit
  format: (lb: number | null | undefined) => string
  isFocus: boolean
  onBack: () => void
}) {
  const title = machine?.name ?? name
  const supportsStraps = Boolean(machine?.prWithStraps) ||
    history.some((row) => row.sets.some((s) => s.withStraps))

  return (
    <>
      <PageHeader
        kicker="Focus · Máquina"
        title={title}
        subtitle={`${sessionCountLabel(machine?.sessionCount ?? history.length)} · toca otro ejercicio desde la lista`}
        back={
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
          >
            ← Todas las máquinas
          </button>
        }
      />

      <div className={isFocus ? 'mt-4 grid gap-2 sm:grid-cols-2' : 'mt-4 space-y-2'}>
        <PrSummaryCard
          label={supportsStraps ? formatStrapsLabel(false) : 'PR actual'}
          pr={machine?.pr ?? null}
          unit={unit}
        />
        {supportsStraps ? (
          <PrSummaryCard
            label={formatStrapsLabel(true)}
            pr={machine?.prWithStraps ?? null}
            unit={unit}
          />
        ) : null}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Cargando entrenos…</p>
      ) : history.length === 0 ? (
        <Card className="mt-4">
          <p className="text-sm text-muted">Sin entrenos en esta máquina.</p>
        </Card>
      ) : (
        <ul className="mt-4 space-y-3">
          {history.map((row) => (
            <li key={`${row.sessionId}-${row.name}-${row.activeGripName ?? ''}`}>
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {formatCoachDate(row.date)}
                    </p>
                    <h2 className="font-display text-lg font-bold text-fg">
                      {row.dayLabel}
                    </h2>
                    {row.activeGripName ? (
                      <p className="text-sm text-muted">
                        Agarre: {row.activeGripName}
                      </p>
                    ) : null}
                    {row.plannedName &&
                    row.plannedName.trim().toLowerCase() !==
                      row.name.trim().toLowerCase() ? (
                      <p className="text-sm text-muted">
                        Alternativa de {row.plannedName}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <ul className="space-y-1 text-sm">
                  {row.sets.map((s) => {
                    const isMark =
                      s.completed &&
                      ((machine?.pr &&
                        !s.withStraps &&
                        s.weight === machine.pr.weight &&
                        s.reps === machine.pr.reps) ||
                        (machine?.prWithStraps &&
                          s.withStraps &&
                          s.weight === machine.prWithStraps.weight &&
                          s.reps === machine.prWithStraps.reps))
                    return (
                      <li
                        key={s.id}
                        className="flex justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-muted"
                      >
                        <span>
                          Serie {s.setNumber}
                          {s.completed ? '' : ' (no)'}
                          {isMark ? ' · PR' : ''}
                        </span>
                        <span className="font-medium text-ink">
                          {format(s.weight)} · {s.reps ?? '—'} · RIR {s.rir ?? '—'}
                          {formatStrapsSuffix(s.withStraps)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {row.note ? (
                  <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-fg">
                    <span className="font-semibold">Nota: </span>
                    {row.note}
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function PrSummaryCard({
  label,
  pr,
  unit,
}: {
  label: string
  pr: ExercisePR | null
  unit: WeightUnit
}) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3 ring-1 ring-line">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {pr ? (
        <>
          <p className="mt-1 font-display text-base font-bold text-fg">
            {formatPrLine(pr, unit)}
          </p>
          <p className="text-xs text-muted">{formatCoachDate(pr.date)}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">Sin marca</p>
      )}
    </div>
  )
}
