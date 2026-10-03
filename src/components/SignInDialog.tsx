import { useEffect, useRef, useState } from 'react'
import { discordEnabled, redirectUrl, supabase } from '../lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
}

type Phase = { kind: 'form' } | { kind: 'sending' } | { kind: 'sent'; email: string } | { kind: 'error'; text: string }

export function SignInDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'form' })

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setPhase({ kind: 'form' })
      d.showModal()
    } else if (!open && d.open) d.close()
  }, [open])

  if (!supabase) return null
  const sb = supabase

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const addr = email.trim()
    if (!addr) return
    setPhase({ kind: 'sending' })
    const { error } = await sb.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true },
    })
    setPhase(error ? { kind: 'error', text: friendly(error.message) } : { kind: 'sent', email: addr })
  }

  const discord = async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: redirectUrl() } })
    if (error) setPhase({ kind: 'error', text: friendly(error.message) })
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="signin-h">
      <div className="dialog-body">
        <div className="dialog-head">
          <h2 id="signin-h">Sign in</h2>
          <button type="button" className="ghost small" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        {phase.kind === 'sent' ? (
          <div className="sent">
            <p>
              We sent a sign-in link to <strong>{phase.email}</strong>. Open it on this device to finish signing in.
            </p>
            <p className="hint">No email after a minute? Check spam, or send it again.</p>
            <button type="button" onClick={() => setPhase({ kind: 'form' })}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <p className="hint">Save your templates to an account and open them on any device. No password needed.</p>

            {discordEnabled && (
              <>
                <button type="button" className="discord" onClick={discord}>
                  Continue with Discord
                </button>
                <p className="or">or</p>
              </>
            )}

            <form onSubmit={sendLink} className="email-form">
              <label htmlFor="signin-email">Email</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <button type="submit" className="primary" disabled={phase.kind === 'sending'}>
                {phase.kind === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
              </button>
            </form>

            {phase.kind === 'error' && (
              <p className="form-error" role="alert">
                {phase.text}
              </p>
            )}
          </>
        )}
      </div>
    </dialog>
  )
}

function friendly(msg: string): string {
  if (/rate limit|too many/i.test(msg)) return 'Too many sign-in emails were sent. Wait a few minutes and try again.'
  if (/invalid.*email/i.test(msg)) return 'That email address doesn’t look right. Check it and try again.'
  if (/provider is not enabled/i.test(msg)) return 'Discord sign-in isn’t turned on for this site yet. Use email instead.'
  return `Sign-in didn’t work: ${msg}`
}
