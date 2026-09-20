import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { WeightUnitProvider } from './context/WeightUnitProvider'
import { AccountSyncBootstrap } from './features/cloud/AccountSyncBootstrap'
import { AuthGate } from './features/cloud/AuthGate'
import { AppRouter } from './app/AppRouter'
import { installCloudAutoSyncHooks } from './sync/autoSync'
import { BrowserRouter } from 'react-router-dom'

installCloudAutoSyncHooks()

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WeightUnitProvider>
          <BrowserRouter>
            <AuthGate>
              <AccountSyncBootstrap />
              <AppRouter />
            </AuthGate>
          </BrowserRouter>
        </WeightUnitProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
