import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initTheme } from './themes/applyTheme'
import './index.css'
import App from './App.tsx'

function boot() {
  try {
    initTheme()
  } catch (err) {
    console.warn('initTheme falló:', err)
  }

  const rootEl = document.getElementById('root')
  if (!rootEl) return

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )

  // Service worker después del primer render (evita pantalla blanca en iOS PWA)
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onOfflineReady() {
          console.info('Mi Gym listo offline')
        },
      })
    })
    .catch((err) => {
      console.warn('PWA no registrada:', err)
    })
}

boot()

// Si React no arranca en 10s, mostrar ayuda (típico caché rota en iPhone)
window.setTimeout(() => {
  const root = document.getElementById('root')
  if (!root || root.childElementCount > 1) return
  const boot = document.getElementById('boot-fallback')
  if (!boot) return
  boot.innerHTML =
    '<p style="margin:0 0 12px;font-weight:600">No cargó la app</p>' +
    '<p style="margin:0 0 16px;font-size:14px;color:#4d6273">Borra caché: Safari → Ajustes → Avanzado → Datos de sitios → busca tu URL → Eliminar. Luego recarga.</p>' +
    '<button type="button" onclick="location.reload()" style="min-height:44px;padding:0 20px;border:none;border-radius:12px;background:#2f8fd6;color:#fff;font-weight:600">Reintentar</button>'
}, 10000)
