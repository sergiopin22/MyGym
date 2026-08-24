import { ThemeProvider } from './context/ThemeProvider'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
