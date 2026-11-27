import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { HomePage } from '../features/routines/HomePage'
import { RoutinesPage } from '../features/routines/RoutinesPage'
import { RoutineDayPage } from '../features/routines/RoutineDayPage'
import { HistoryDetailPage, HistoryPage } from '../features/history/HistoryPage'
import { EditCompletedSessionPage } from '../features/history/EditCompletedSessionPage'
import { ManualExerciseLogPage } from '../features/history/ManualExerciseLogPage'
import { ManualLogPage } from '../features/history/ManualLogPage'
import { WeeklySummaryPage } from '../features/history/WeeklySummaryPage'
import { ProgressPage } from '../features/progress/ProgressPage'
import { PrCelebrationSettingsPage } from '../features/settings/PrCelebrationSettingsPage'
import { WorkoutPage } from '../features/workout/WorkoutPage'
import { TreadmillPage } from '../features/cardio/TreadmillPage'
import { PlateCalculatorPage } from '../features/tools/PlateCalculatorPage'
import { StandaloneTimerPage } from '../features/tools/StandaloneTimerPage'
import { TimerCustomSkinEditor } from '../features/tools/TimerCustomSkinEditor'
import { TimerCustomSkinPage } from '../features/tools/TimerCustomSkinPage'
import { TimerPreviewPage } from '../features/tools/TimerPreviewPage'
import { CoachPage } from '../features/coach/CoachPage'
import { PrCelebrationPreviewPage } from '../features/workout/PrCelebrationPreviewPage'

export function AppRouter() {
  return (
    <Routes>
      {import.meta.env.DEV ? (
        <Route path="dev/pr" element={<PrCelebrationPreviewPage />} />
      ) : null}
      <Route path="entrenar/:sessionId" element={<WorkoutPage />} />
      <Route path="coach/:token" element={<CoachPage />} />
      <Route path="coach" element={<CoachPage />} />
      <Route path="caminadora" element={<TreadmillPage />} />
      <Route
        path="historial/cargar"
        element={<ManualLogPage />}
      />
      <Route
        path="historial/cargar-ejercicio"
        element={<ManualExerciseLogPage />}
      />
      <Route
        path="historial/:sessionId/editar"
        element={<EditCompletedSessionPage />}
      />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="rutinas/:dayId" element={<RoutineDayPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route
          path="historial/resumen-semanal"
          element={<WeeklySummaryPage />}
        />
        <Route path="historial/:sessionId" element={<HistoryDetailPage />} />
        <Route path="discos" element={<PlateCalculatorPage />} />
        <Route path="temporizador" element={<StandaloneTimerPage />} />
        <Route
          path="temporizador/preview"
          element={<TimerPreviewPage />}
        />
        <Route
          path="temporizador/personalizar"
          element={<TimerCustomSkinPage />}
        />
        <Route
          path="temporizador/personalizar/:skinId"
          element={<TimerCustomSkinEditor />}
        />
        <Route path="progreso" element={<ProgressPage />} />
        <Route
          path="progreso/animacion-pr"
          element={<PrCelebrationSettingsPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
