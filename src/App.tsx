import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { AccountSyncBootstrap } from './features/cloud/AccountSyncBootstrap'
import { AuthGate } from './features/cloud/AuthGate'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <AccountSyncBootstrap />
          <AppRouter />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  )
}
