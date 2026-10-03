import { useEffect, useState } from 'react'
import { AccountMenu } from './components/AccountMenu'
import { Editor } from './components/Editor'
import { SignInDialog } from './components/SignInDialog'
import { StatsView } from './components/StatsView'
import { TemplateList } from './components/TemplateList'
import { useAuth } from './hooks/useAuth'
import { useTemplates, type SaveState } from './hooks/useTemplates'
import { useTheme, type ThemeChoice } from './hooks/useTheme'
import { downloadJson, slug } from './lib/storage'
import { supabase } from './lib/supabase'
import { blankTemplate, decodeShare, newId, sanitize, shareUrl, type Template } from './lib/template'

type View = 'builder' | 'stats'

function readShareFromHash(): Template | null {
  const m = window.location.hash.match(/share=([A-Za-z0-9_-]+)/)
  return m ? decodeShare(m[1]) : null
}

function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

const SAVE_LABEL: Record<SaveState, string> = {
  idle: 'Saved to your account',
  saved: 'Saved to your account',
  saving: 'Saving…',
  error: 'Couldn’t save.',
}

export default function App() {
  const auth = useAuth()
  const userId = auth.ready ? (auth.session?.user.id ?? null) : null
  const store = useTemplates(userId)
  const { templates } = store

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shared, setShared] = useState<Template | null>(readShareFromHash)
  const [view, setView] = useState<View>('builder')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    const onHash = () => setShared(readShareFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  // Falls back to the first template while the list loads or after a delete.
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null
  const signedIn = store.mode === 'cloud'

  const addTemplate = (t: Template) => {
    store.add([t])
    setSelectedId(t.id)
    setView('builder')
    setDrawerOpen(false)
  }

  const handleShare = async (t: Template) => {
    const url = shareUrl(t)
    try {
      await navigator.clipboard.writeText(url)
      setToast('Share link copied')
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const handleDelete = async (t: Template) => {
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return
    const ok = await store.remove(t.id)
    setToast(ok ? 'Template deleted' : 'Couldn’t delete the template. Check your connection and try again.')
  }

  const handleImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      const items = (Array.isArray(data) ? data : [data])
        .map(sanitize)
        .filter((t): t is Template => t !== null)
        .map((t) => ({ ...t, id: newId() }))
      if (items.length === 0) throw new Error('empty')
      store.add(items)
      setSelectedId(items[0].id)
      setDrawerOpen(false)
      setToast(`Imported ${items.length} template${items.length === 1 ? '' : 's'}`)
    } catch {
      setToast('That file isn’t a template export. Use a .json file from Export JSON.')
    }
  }

  const saveShared = () => {
    if (!shared) return
    addTemplate({ ...shared, id: newId(), updatedAt: Date.now() })
    setShared(null)
    clearHash()
    setToast(signedIn ? 'Saved to your account' : 'Saved to your templates')
  }

  const signOut = async () => {
    await store.flush()
    await supabase?.auth.signOut()
    setToast('Signed out')
  }

  const moveLocal = async () => {
    const n = store.localToMove.length
    const ok = await store.moveLocal()
    setToast(
      ok ? `Added ${n} template${n === 1 ? '' : 's'} to your account` : 'Couldn’t add them. Check your connection and try again.',
    )
  }

  const list = (
    <TemplateList
      templates={templates}
      selectedId={shared ? null : (selected?.id ?? null)}
      onSelect={(id) => {
        setSelectedId(id)
        setView('builder')
        setDrawerOpen(false)
        if (shared) {
          setShared(null)
          clearHash()
        }
      }}
      onNew={() => addTemplate(blankTemplate())}
      onImport={handleImport}
      footer={
        supabase && !signedIn && auth.ready ? (
          <p className="hint rail-note">
            Saved in this browser only.{' '}
            <button type="button" className="linkish" onClick={() => setSignInOpen(true)}>
              Sign in
            </button>{' '}
            to keep them on every device.
          </p>
        ) : null
      }
    />
  )

  const loading = !auth.ready || store.status === 'loading'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--primary)" />
            <rect x="6" y="20" width="5" height="6" rx="1" fill="var(--c-combat)" />
            <rect x="13.5" y="13" width="5" height="13" rx="1" fill="var(--c-magic)" />
            <rect x="21" y="7" width="5" height="19" rx="1" fill="var(--c-trade)" />
          </svg>
          <span>Outlands Build Companion</span>
        </div>

        <nav className="tabs" aria-label="Sections">
          <button type="button" className={view === 'builder' ? 'on' : ''} onClick={() => setView('builder')}>
            Templates
          </button>
          <button type="button" className={view === 'stats' ? 'on' : ''} onClick={() => setView('stats')}>
            Damage stats
          </button>
        </nav>

        <div className="topbar-end">
          <label className="theme-pick">
            <span className="sr-only">Color theme</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeChoice)}>
              <option value="system">Auto theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          {supabase && auth.ready &&
            (auth.session ? (
              <AccountMenu session={auth.session} onSignOut={signOut} />
            ) : (
              <button type="button" className="primary signin-btn" onClick={() => setSignInOpen(true)}>
                Sign in
              </button>
            ))}
        </div>
      </header>

      {view === 'builder' ? (
        <div className="layout">
          <aside className="rail">{list}</aside>

          <main className="main">
            <button
              type="button"
              className="drawer-toggle"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((o) => !o)}
            >
              {drawerOpen ? 'Hide templates' : `Your templates (${templates.length})`}
            </button>
            {drawerOpen && <div className="drawer">{list}</div>}

            {signedIn && store.localToMove.length > 0 && !shared && (
              <div className="banner">
                <p>
                  This browser has {store.localToMove.length} template{store.localToMove.length === 1 ? '' : 's'} you
                  made before signing in.
                </p>
                <div className="banner-actions">
                  <button type="button" className="primary" onClick={moveLocal}>
                    Add to my account
                  </button>
                  <button type="button" onClick={store.dismissLocal}>
                    Not now
                  </button>
                </div>
              </div>
            )}

            {store.status === 'error' ? (
              <div className="blank">
                <h1>Couldn’t load your templates</h1>
                <p>Check your connection, then try again.</p>
                <button type="button" className="primary" onClick={store.retry}>
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="blank" aria-busy="true">
                <p>Loading your templates…</p>
              </div>
            ) : shared ? (
              <>
                <div className="banner">
                  <p>You're viewing a shared template. Changes stay here until you save it.</p>
                  <div className="banner-actions">
                    <button type="button" className="primary" onClick={saveShared}>
                      Save to my templates
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShared(null)
                        clearHash()
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <Editor
                  template={shared}
                  onChange={setShared}
                  onShare={() => handleShare(shared)}
                  onExport={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                  readOnly
                />
              </>
            ) : selected ? (
              <Editor
                template={selected}
                onChange={store.update}
                onShare={() => handleShare(selected)}
                onExport={() => downloadJson(`${slug(selected.name)}.json`, selected)}
                onDuplicate={() => addTemplate({ ...selected, id: newId(), name: `${selected.name} (copy)`, updatedAt: Date.now() })}
                onDelete={() => handleDelete(selected)}
                status={
                  signedIn ? (
                    <p className={`save-state ${store.saveState}`} role="status">
                      {SAVE_LABEL[store.saveState]}
                      {store.saveState === 'error' && (
                        <>
                          {' '}
                          <button type="button" className="linkish" onClick={store.retry}>
                            Try again
                          </button>
                        </>
                      )}
                    </p>
                  ) : null
                }
              />
            ) : (
              <div className="blank">
                <h1>Plan your next character</h1>
                <p>Spend your 700 skill points and 225 stat points, then share the build with a link.</p>
                <button type="button" className="primary" onClick={() => addTemplate(blankTemplate())}>
                  Create a template
                </button>
              </div>
            )}
          </main>
        </div>
      ) : (
        <main className="main solo">
          <StatsView />
        </main>
      )}

      <footer className="site-foot">
        Fan-made tool, not affiliated with UO Outlands.{' '}
        {signedIn ? 'Templates are saved to your account.' : 'Templates are saved in this browser only.'}
      </footer>

      <SignInDialog open={signInOpen && !auth.session} onClose={() => setSignInOpen(false)} />

      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </div>
  )
}
