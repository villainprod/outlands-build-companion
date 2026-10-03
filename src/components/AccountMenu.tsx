import type { Session } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { avatarUrl, displayName } from '../hooks/useAuth'

interface Props {
  session: Session
  onSignOut: () => void
}

export function AccountMenu({ session, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = displayName(session)
  const avatar = avatarUrl(session)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="account-btn"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={name}
      >
        {avatar ? (
          <img src={avatar} alt="" width={28} height={28} referrerPolicy="no-referrer" />
        ) : (
          <span className="initial" aria-hidden="true">
            {name.trim()[0]?.toUpperCase() ?? '?'}
          </span>
        )}
        <span className="sr-only">Account: {name}</span>
      </button>
      {open && (
        <div className="account-pop">
          <p className="account-name">{name}</p>
          {session.user.email && session.user.email !== name && <p className="hint">{session.user.email}</p>}
          <p className="hint">Your templates are saved to this account.</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
