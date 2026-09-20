import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { HomePage } from '../features/routines/HomePage'
import { RoutinesPage } from '../features/routines/RoutinesPage'
import { RoutineDayPage } from '../features/routines/RoutineDayPage'
import { HistoryDetailPage, HistoryPage } from '../features/history/HistoryPage'
import { EditCompletedSessionPage } from '../features/history/EditCompletedSessionPage'
import { ProgressPage } from '../features/progress/ProgressPage'
import { WorkoutPage } from '../features/workout/WorkoutPage'
import { TreadmillPage } from '../features/cardio/TreadmillPage'
import { PlateCalculatorPage } from '../features/tools/PlateCalculatorPage'
import { CoachPage } from '../features/coach/CoachPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="entrenar/:sessionId" element={<WorkoutPage />} />
      <Route path="coach/:token" element={<CoachPage />} />
      <Route path="coach" element={<CoachPage />} />
      <Route path="caminadora" element={<TreadmillPage />} />
      <Route
        path="historial/:sessionId/editar"
        element={<EditCompletedSessionPage />}
      />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="rutinas/:dayId" element={<RoutineDayPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="historial/:sessionId" element={<HistoryDetailPage />} />
        <Route path="discos" element={<PlateCalculatorPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
