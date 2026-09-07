import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { AccountSyncBootstrap } from './features/cloud/AccountSyncBootstrap'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AccountSyncBootstrap />
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}
