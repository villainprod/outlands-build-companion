import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AuthState {
  /** False until the saved session (if any) has been read. */
  ready: boolean
  session: Session | null
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ ready: !supabase, session: null })

  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState({ ready: true, session: data.session })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, session })
      // Tidy the ?code=… left behind by the sign-in redirect.
      if (session && new URLSearchParams(window.location.search).has('code')) {
        history.replaceState(null, '', window.location.pathname + window.location.hash)
      }
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}

export function displayName(session: Session): string {
  const m = session.user.user_metadata ?? {}
  return (
    (m.custom_claims?.global_name as string | undefined) ||
    (m.full_name as string | undefined) ||
    (m.name as string | undefined) ||
    session.user.email ||
    'Signed in'
  )
}

export function avatarUrl(session: Session): string | null {
  const m = session.user.user_metadata ?? {}
  return (m.avatar_url as string | undefined) || null
}
