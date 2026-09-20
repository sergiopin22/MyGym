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
import { useWeightUnit } from '../../context/WeightUnitProvider'
import { ExerciseStatsPanel } from '../routines/ExerciseStatsPanel'
import { formatStrapsLabel, formatStrapsSuffix } from '../../utils/straps'
import {
  formatWeight,
  formatWeightPair,
  type WeightUnit,
} from '../../utils/weight'
import { getStoredDisplayName } from '../../utils/displayName'
import { machineIdentityKey } from '../../utils/machineName'
import {
  buildCoachSharePayload,
  fetchCoachSharePayload,
  historyKey,
  type CoachSharePayload,
} from './coachShare'
import { applyCoachViewSkin, clearCoachViewSkin } from './coachTheme'
import { CoachShareBar } from './CoachShareBar'
import { DisplayNamePrompt } from '../settings/DisplayNamePrompt'

type CoachTab = 'machines' | 'prs'

const COACH_MUSCLE_FILTERS = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'hombro', label: 'Hombro' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'pierna', label: 'Pierna' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'espalda', label: 'Espalda' },
] as const

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
  return machineIdentityKey(value)
}

function sessionCountLabel(count: number): string {
  return count === 1 ? '1 entreno' : `${count} entrenos`
}

function machineMatchesMuscle(
  groups: string[] | undefined,
  filterId: string | null,
): boolean {
  if (!filterId) return true
  return (groups ?? []).some((group) => {
    const n = foldName(group)
    return n === filterId || n.startsWith(filterId)
  })
}

function muscleLine(groups: string[] | undefined): string {
  return (groups ?? []).join(' · ')
}

function MaintenanceTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-danger/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-danger">
      En mantenimiento
    </span>
  )
}

export function CoachPage() {
  const { token } = useParams<{ token?: string }>()
  const isPublic = Boolean(token)
  const { user } = useAuth()
  const { unit: localUnit } = useWeightUnit()
  const [tab, setTab] = useState<CoachTab>('machines')
  const [query, setQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [payload, setPayload] = useState<CoachSharePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const [nameTick, setNameTick] = useState(0)
  const athleteName = useMemo(() => {
    if (isPublic) return payload?.athleteName?.trim() || ''
    return getStoredDisplayName(user?.id)
  }, [isPublic, payload?.athleteName, user?.id, nameTick])

  const unit = payload?.unit ?? localUnit
  const format = (lb: number | null | undefined) => formatWeight(lb, unit)

  useEffect(() => {
    applyCoachViewSkin()
    return () => clearCoachViewSkin()
  }, [])

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
    () =>
      machines.filter(
        (row) =>
          matchesQuery(row.name, query) &&
          machineMatchesMuscle(row.muscleGroups, muscleFilter),
      ),
    [machines, query, muscleFilter],
  )

  const filteredPrs = useMemo(
    () =>
      prs.filter((pr) => {
        if (
          !matchesQuery(
            `${pr.exerciseName} ${pr.gripName ?? ''} ${pr.withStraps ? 'straps' : ''}`,
            query,
          )
        ) {
          return false
        }
        if (!muscleFilter) return true
        const machine = machines.find(
          (row) => foldName(row.name) === foldName(prMachineName(pr)),
        )
        return machineMatchesMuscle(machine?.muscleGroups, muscleFilter)
      }),
    [prs, machines, query, muscleFilter],
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

  const muscleChips = (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrar por músculo"
    >
      <button
        type="button"
        onClick={() => setMuscleFilter(null)}
        className={[
          'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
          muscleFilter === null
            ? 'bg-chrome text-chrome-fg'
            : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
        ].join(' ')}
      >
        Todos
      </button>
      {COACH_MUSCLE_FILTERS.map((group) => {
        const active = muscleFilter === group.id
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => setMuscleFilter(active ? null : group.id)}
            className={[
              'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
              active
                ? 'bg-chrome text-chrome-fg'
                : 'bg-surface text-muted ring-1 ring-line hover:text-fg',
            ].join(' ')}
          >
            {group.label}
          </button>
        )
      })}
    </div>
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
            onBack={() => setSelectedName(null)}
          />
        ) : (
          <>
            <PageHeader
              forceFocus
              kicker={athleteName ? `Coach · ${athleteName}` : 'Coach'}
              title={
                isPublic
                  ? athleteName || 'Historial del atleta'
                  : 'Vista coach'
              }
              subtitle={
                isPublic
                  ? athleteName
                    ? `Historial y PRs de ${athleteName}. Solo lectura.`
                    : 'Solo lectura. Filtra por máquina o mira todos los PRs.'
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

            {isPublic ? null : (
              <>
                <div className="mt-3">
                  <DisplayNamePrompt onSaved={() => setNameTick((n) => n + 1)} />
                </div>
                <CoachShareBar />
              </>
            )}

            {loadError ? (
              <p className="mt-4 rounded-2xl bg-surface px-3 py-3 text-sm font-medium text-danger ring-1 ring-line">
                {loadError}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {tabBar}
              {muscleChips}
              {search}
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-muted">Cargando…</p>
            ) : tab === 'machines' ? (
              <MachineList
                rows={filteredMachines}
                empty={
                  machines.length === 0
                    ? 'Aún no hay máquinas en la rutina ni entrenos para mostrar.'
                    : muscleFilter || query.trim()
                      ? 'Ninguna máquina con ese filtro.'
                      : 'Ninguna máquina con ese nombre.'
                }
                unit={unit}
                onOpen={openMachine}
              />
            ) : (
              <PrList
                rows={filteredPrs}
                machines={machines}
                empty={
                  prs.length === 0
                    ? 'Todavía no hay PRs registrados.'
                    : muscleFilter || query.trim()
                      ? 'Ningún PR con ese filtro.'
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold text-fg">
                      {row.name}
                    </p>
                    {row.underMaintenance ? <MaintenanceTag /> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {row.sessionCount > 0
                      ? `${sessionCountLabel(row.sessionCount)} · último ${formatCoachDate(row.lastDate)}`
                      : 'Aún sin entrenos'}
                  </p>
                  {muscleLine(row.muscleGroups) ? (
                    <p className="mt-0.5 text-xs font-medium text-muted">
                      {muscleLine(row.muscleGroups)}
                    </p>
                  ) : null}
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
  machines,
  empty,
  unit,
  onOpen,
}: {
  rows: ExercisePR[]
  machines: CoachMachineSummary[]
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
      {rows.map((pr) => {
        const machine = machines.find(
          (row) => foldName(row.name) === foldName(prMachineName(pr)),
        )
        return (
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold text-fg">
                    {pr.exerciseName}
                  </p>
                  {machine?.underMaintenance ? <MaintenanceTag /> : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-fg">
                  {formatPrLine(pr, unit)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatCoachDate(pr.date)}
                  {pr.withStraps ? ` · ${formatStrapsLabel(true)}` : ''}
                  {muscleLine(machine?.muscleGroups)
                    ? ` · ${muscleLine(machine?.muscleGroups)}`
                    : ''}
                </p>
              </div>
            </div>
          </button>
        </li>
        )
      })}
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
  onBack,
}: {
  name: string
  machine?: CoachMachineSummary
  history: CoachMachineSession[]
  loading: boolean
  unit: WeightUnit
  format: (lb: number | null | undefined) => string
  onBack: () => void
}) {
  const title = machine?.name ?? name
  const supportsStraps = Boolean(machine?.prWithStraps) ||
    history.some((row) => row.sets.some((s) => s.withStraps))
  const groups = muscleLine(machine?.muscleGroups)
  const subtitleParts = [
    sessionCountLabel(machine?.sessionCount ?? history.length),
    groups,
    'toca otro ejercicio desde la lista',
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        forceFocus
        kicker="Focus · Máquina"
        title={title}
        subtitle={subtitleParts.join(' · ')}
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

      {machine?.underMaintenance ? (
        <p className="mt-3">
          <MaintenanceTag />
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
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

      {!loading && history.length > 0 ? (
        <div className="mt-4">
          <ExerciseStatsPanel
            embedded
            forceFocus
            unitOverride={unit}
            historySource={history}
            target={{
              baseName: title,
              displayName: title,
              supportsStraps,
            }}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Cargando entrenos…</p>
      ) : history.length === 0 ? (
        <Card className="mt-4">
          <p className="text-sm text-muted">Sin entrenos en esta máquina.</p>
        </Card>
      ) : (
        <>
          <p className="pr-stats__kicker mt-5">Historial</p>
          <ul className="mt-2 space-y-3">
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
        </>
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
