import { useCallback, useEffect, useState } from 'react'
import { Editor } from './components/Editor'
import { StatsView } from './components/StatsView'
import { TemplateList } from './components/TemplateList'
import { useTheme, type ThemeChoice } from './hooks/useTheme'
import { downloadJson, loadTemplates, saveTemplates, slug } from './lib/storage'
import { blankTemplate, decodeShare, newId, sanitize, shareUrl, type Template } from './lib/template'

type View = 'builder' | 'stats'

function readShareFromHash(): Template | null {
  const m = window.location.hash.match(/share=([A-Za-z0-9_-]+)/)
  return m ? decodeShare(m[1]) : null
}

function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

export default function App() {
  const [templates, setTemplates] = useState<Template[]>(loadTemplates)
  const [selectedId, setSelectedId] = useState<string | null>(() => templates[0]?.id ?? null)
  const [shared, setShared] = useState<Template | null>(readShareFromHash)
  const [view, setView] = useState<View>('builder')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useTheme()

  useEffect(() => saveTemplates(templates), [templates])

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

  const selected = templates.find((t) => t.id === selectedId) ?? null

  const update = useCallback((t: Template) => {
    const next = { ...t, updatedAt: Date.now() }
    setTemplates((list) => list.map((x) => (x.id === t.id ? next : x)))
  }, [])

  const addTemplate = (t: Template) => {
    setTemplates((list) => [t, ...list])
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

  const handleDelete = (t: Template) => {
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return
    const rest = templates.filter((x) => x.id !== t.id)
    setTemplates(rest)
    setSelectedId(rest[0]?.id ?? null)
    setToast('Template deleted')
  }

  const handleImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      const items = (Array.isArray(data) ? data : [data])
        .map(sanitize)
        .filter((t): t is Template => t !== null)
        .map((t) => ({ ...t, id: newId() }))
      if (items.length === 0) throw new Error('empty')
      setTemplates((list) => [...items, ...list])
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
    setToast('Saved to your templates')
  }

  const list = (
    <TemplateList
      templates={templates}
      selectedId={shared ? null : selectedId}
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
    />
  )

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

        <label className="theme-pick">
          <span className="sr-only">Color theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeChoice)}>
            <option value="system">System theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
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

            {shared ? (
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
                onChange={update}
                onShare={() => handleShare(selected)}
                onExport={() => downloadJson(`${slug(selected.name)}.json`, selected)}
                onDuplicate={() => addTemplate({ ...selected, id: newId(), name: `${selected.name} (copy)` })}
                onDelete={() => handleDelete(selected)}
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
        Fan-made tool, not affiliated with UO Outlands. Templates are saved in this browser only.
      </footer>

      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </div>
  )
}
