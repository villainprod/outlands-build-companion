import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Accounts are optional. If these two values aren't set at build time,
// the app runs in "this browser only" mode and hides the Sign in button.
// The publishable key is meant to be public: row-level security in
// supabase/schema.sql is what keeps each person's templates private.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const AUTH_STORAGE_KEY = 'obc.auth'

export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          flowType: 'pkce',
          storageKey: AUTH_STORAGE_KEY,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

/** Set VITE_ENABLE_DISCORD=true once the Discord provider is turned on in Supabase. */
export const discordEnabled = import.meta.env.VITE_ENABLE_DISCORD === 'true'

/** Where Supabase sends people back to after the email link or Discord. */
export function redirectUrl(): string {
  return window.location.origin + window.location.pathname
}
