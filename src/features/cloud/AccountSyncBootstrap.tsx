import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { reconcileAccountOnLogin } from '../../sync/reconcile'

/**
 * Al haber sesión: trae (o sube) los datos de la cuenta sin pedir "Bajar".
 */
export function AccountSyncBootstrap() {
  const { user, loading } = useAuth()
  const [banner, setBanner] = useState<string | null>(null)
  const ranForUser = useRef<string | null>(null)

  useEffect(() => {
    if (loading || !user) {
      if (!user) ranForUser.current = null
      return
    }
    if (ranForUser.current === user.id) return
    ranForUser.current = user.id

    let cancelled = false

    void (async () => {
      setBanner('Sincronizando tu cuenta…')
      try {
        const result = await reconcileAccountOnLogin(user.id, (step) => {
          if (!cancelled) setBanner(step)
        })
        if (cancelled) return

        if (result.action === 'downloaded') {
          setBanner(result.detail + ' Recargando…')
          window.setTimeout(() => window.location.reload(), 900)
          return
        }

        setBanner(result.detail)
        window.setTimeout(() => {
          if (!cancelled) setBanner(null)
        }, 3500)
      } catch (err) {
        if (cancelled) return
        setBanner(
          err instanceof Error
            ? `Sync: ${err.message}`
            : 'No se pudo sincronizar la cuenta',
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (!banner) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="status"
    >
      <p className="pointer-events-auto max-w-md rounded-2xl bg-chrome px-4 py-2 text-center text-sm font-semibold text-chrome-fg shadow-lg">
        {banner}
      </p>
    </div>
  )
}
