import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { updateRoutineName } from '../../db/repository'
import { useBootstrapRoutine } from '../../hooks/useBootstrapRoutine'
import { weekdayLabel } from '../../utils/id'
import { BackupPanel } from '../backup/BackupPanel'
import { PageHeader } from '../../ui/PageHeader'
import { useTheme } from '../../context/ThemeProvider'

export function RoutinesPage() {
  const { routine, loading, error, setRoutine } = useBootstrapRoutine()
  const [name, setName] = useState('')
  const { uiLayout } = useTheme()
  const isFocus = uiLayout === 'focus'

  useEffect(() => {
    if (routine) setName(routine.name)
  }, [routine])

  if (loading) {
    return (
      <p className={['pt-8 text-muted', isFocus ? 'focus-section-pad' : ''].join(' ')}>
        Cargando rutina…
      </p>
    )
  }
  if (error) {
    return (
      <p className={['pt-8 text-danger', isFocus ? 'focus-section-pad' : ''].join(' ')}>
        {error}
      </p>
    )
  }
  if (!routine) return null

  const current = routine

  async function persistName() {
    const next = name.trim() || current.name
    if (next === current.name) return
    const updated = await updateRoutineName(current.id, next)
    setRoutine(updated)
    setName(updated.name)
  }

  const dayCards = routine.days.map((day) => (
    <Link
      key={day.id}
      to={`/rutinas/${day.id}`}
      className={isFocus ? 'focus-rail__card block' : 'block'}
    >
      <Card
        className={[
          'transition hover:border-brand/50 active:scale-[0.99]',
          isFocus ? 'h-full' : '',
        ].join(' ')}
      >
        <div className="flex h-full items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {weekdayLabel(day.weekday)}
            </p>
            <h2 className="font-display text-lg font-bold">
              {day.isRestDay ? 'Descanso' : day.label}
            </h2>
            <p className="mt-1 truncate text-sm text-muted">
              {day.isRestDay
                ? 'No iré al gym'
                : day.muscleGroups.length
                  ? day.muscleGroups.join(' · ')
                  : 'Sin grupos musculares'}
            </p>
            {!day.isRestDay ? (
              <p className="mt-1 text-sm font-medium text-ink">
                {day.exercises.length} ejercicio
                {day.exercises.length === 1 ? '' : 's'}
              </p>
            ) : (
              <p className="mt-1 text-sm font-medium text-muted">😴 Día libre</p>
            )}
          </div>
          <span className="text-2xl text-brand-strong" aria-hidden>
            ›
          </span>
        </div>
      </Card>
    </Link>
  ))

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Focus · Plan"
        title="Rutinas"
        subtitle={
          isFocus
            ? 'Desliza los días como un carrusel. Toca uno para editarlo.'
            : 'Arma tu semana: días, músculos y ejercicios.'
        }
      />

      <Card>
        <TextField
          label="Nombre de la rutina"
          name="routineName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void persistName()}
        />
      </Card>

      {isFocus ? (
        <div className="focus-rail" aria-label="Días de la rutina">
          {dayCards}
        </div>
      ) : (
        <ul className="space-y-3">
          {routine.days.map((day) => (
            <li key={day.id}>
              <Link to={`/rutinas/${day.id}`} className="block">
                <Card className="transition hover:border-brand/50 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {weekdayLabel(day.weekday)}
                      </p>
                      <h2 className="font-display text-lg font-bold">
                        {day.isRestDay ? 'Descanso' : day.label}
                      </h2>
                      <p className="mt-1 truncate text-sm text-muted">
                        {day.isRestDay
                          ? 'No iré al gym'
                          : day.muscleGroups.length
                            ? day.muscleGroups.join(' · ')
                            : 'Sin grupos musculares'}
                      </p>
                      {!day.isRestDay ? (
                        <p className="mt-1 text-sm font-medium text-ink">
                          {day.exercises.length} ejercicio
                          {day.exercises.length === 1 ? '' : 's'}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-muted">😴 Día libre</p>
                      )}
                    </div>
                    <span className="text-2xl text-brand-strong" aria-hidden>
                      ›
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BackupPanel />
    </div>
  )
}
