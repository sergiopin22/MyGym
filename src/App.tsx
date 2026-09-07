import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { WeightUnitProvider } from './context/WeightUnitProvider'
import { AccountSyncBootstrap } from './features/cloud/AccountSyncBootstrap'
import { AuthGate } from './features/cloud/AuthGate'
import { AppRouter } from './app/AppRouter'
import { installCloudAutoSyncHooks } from './sync/autoSync'

installCloudAutoSyncHooks()

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WeightUnitProvider>
          <AuthGate>
            <AccountSyncBootstrap />
            <AppRouter />
          </AuthGate>
        </WeightUnitProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
