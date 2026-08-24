import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { HomePage } from '../features/routines/HomePage'
import { RoutinesPage } from '../features/routines/RoutinesPage'
import { RoutineDayPage } from '../features/routines/RoutineDayPage'
import { HistoryDetailPage, HistoryPage } from '../features/history/HistoryPage'
import { ProgressPage } from '../features/progress/ProgressPage'
import { WorkoutPage } from '../features/workout/WorkoutPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="entrenar/:sessionId" element={<WorkoutPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rutinas" element={<RoutinesPage />} />
          <Route path="rutinas/:dayId" element={<RoutineDayPage />} />
          <Route path="historial" element={<HistoryPage />} />
          <Route path="historial/:sessionId" element={<HistoryDetailPage />} />
          <Route path="progreso" element={<ProgressPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
