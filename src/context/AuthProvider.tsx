import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar (revisa la bandeja).'
  }
  if (m.includes('user already registered')) {
    return 'Ese correo ya tiene cuenta. Prueba iniciar sesión.'
  }
  if (m.includes('password')) return 'La contraseña no cumple los requisitos.'
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera un momento.'
  }
  return message || 'No se pudo completar la autenticación.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    let alive = true
    void sb.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [configured])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      async signIn(email, password) {
        const sb = getSupabase()
        if (!sb) throw new Error('Supabase no está configurado.')
        const { error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw new Error(mapAuthError(error.message))
      },
      async signUp(email, password) {
        const sb = getSupabase()
        if (!sb) throw new Error('Supabase no está configurado.')
        const { error } = await sb.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) throw new Error(mapAuthError(error.message))
      },
      async signOut() {
        const sb = getSupabase()
        if (!sb) return
        const { error } = await sb.auth.signOut()
        if (error) throw new Error(mapAuthError(error.message))
      },
    }),
    [configured, loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
