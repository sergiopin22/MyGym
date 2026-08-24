import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Mi Gym crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="font-display text-xl font-bold text-fg">Algo falló al cargar</p>
          <p className="max-w-sm text-sm text-muted">
            En iPhone suele ser caché vieja. Prueba recargar o borrar datos del sitio en
            Safari.
          </p>
          <p className="max-w-sm break-all text-xs text-danger">
            {this.state.error.message}
          </p>
          <Button onClick={() => window.location.reload()}>Recargar app</Button>
        </div>
      )
    }
    return this.props.children
  }
}
