import { useCallback, useEffect, useState } from 'react'
import {
  ensureDefaultRoutine,
  getActiveSession,
  getCompletedSessionToday,
  startSession,
} from '../db/repository'
import type { RoutineDay, WorkoutSession } from '../types'
import { weekdayLabel } from '../utils/id'

export type WorkoutFabMode =
  | 'loading'
  | 'continue'
  | 'start'
  | 'view_today'
  | 'go_home'

export interface WorkoutFabState {
  mode: WorkoutFabMode
  label: string
  ariaLabel: string
  sessionId?: string
  dayId?: string
  activeSession?: WorkoutSession
}

function findTodayDay(days: RoutineDay[]): RoutineDay | undefined {
  const today = new Date().getDay()
  return days.find((d) => d.weekday === today)
}

export function useWorkoutFabAction(refreshKey = 0) {
  const [state, setState] = useState<WorkoutFabState>({
    mode: 'loading',
    label: '…',
    ariaLabel: 'Cargando entrenamiento',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const [routine, active, completedToday] = await Promise.all([
        ensureDefaultRoutine(),
        getActiveSession(),
        getCompletedSessionToday(),
      ])

      if (active) {
        setState({
          mode: 'continue',
          label: 'Continuar',
          ariaLabel: `Continuar entrenamiento ${active.dayLabel}`,
          sessionId: active.id,
          activeSession: active,
        })
        return
      }

      const todayDay = findTodayDay(routine.days)
      if (!todayDay) {
        setState({
          mode: 'go_home',
          label: 'Entrenar',
          ariaLabel: 'Ver inicio para entrenar',
        })
        return
      }

      if (completedToday) {
        setState({
          mode: 'view_today',
          label: 'Ver hoy',
          ariaLabel: 'Ver entrenamiento de hoy',
          sessionId: completedToday.id,
        })
        return
      }

      if (todayDay.isRestDay) {
        setState({
          mode: 'go_home',
          label: 'Descanso',
          ariaLabel: 'Hoy es día de descanso',
        })
        return
      }

      if (todayDay.exercises.length === 0) {
        setState({
          mode: 'go_home',
          label: 'Entrenar',
          ariaLabel: 'Agrega ejercicios en rutinas',
        })
        return
      }

      setState({
        mode: 'start',
        label: 'Entrenar',
        ariaLabel: `Empezar entrenamiento de ${weekdayLabel(todayDay.weekday)}`,
        dayId: todayDay.id,
      })
    } catch {
      setState({
        mode: 'go_home',
        label: 'Entrenar',
        ariaLabel: 'Ir a inicio',
      })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  async function runAction(
    navigate: (path: string) => void,
  ): Promise<void> {
    if (busy || state.mode === 'loading') return
    setBusy(true)
    setError(null)
    try {
      if (state.mode === 'continue' && state.sessionId) {
        navigate(`/entrenar/${state.sessionId}`)
        return
      }
      if (state.mode === 'view_today' && state.sessionId) {
        navigate(`/historial/${state.sessionId}`)
        return
      }
      if (state.mode === 'start' && state.dayId) {
        const session = await startSession(state.dayId)
        navigate(`/entrenar/${session.id}`)
        return
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar')
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    } finally {
      setBusy(false)
    }
  }

  return { state, busy, error, runAction, reload, clearError: () => setError(null) }
}
