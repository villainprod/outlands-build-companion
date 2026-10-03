import { useRef, type ReactNode } from 'react'
import { FOCUS_LABEL, skillCap, skillTotal, type Template } from '../lib/template'

interface Props {
  templates: Template[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onImport: (file: File) => void
  footer?: ReactNode
}

export function TemplateList({ templates, selectedId, onSelect, onNew, onImport, footer }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <nav className="tlist" aria-label="Your templates">
      <div className="tlist-head">
        <h2>Your templates</h2>
        <div className="tlist-buttons">
          <button type="button" className="primary small" onClick={onNew}>
            New
          </button>
          <button type="button" className="small" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {templates.length === 0 ? (
        <p className="empty">No templates yet. Create one to get started.</p>
      ) : (
        <ul>
          {templates.map((t) => {
            const total = skillTotal(t)
            const cap = skillCap(t)
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={t.id === selectedId ? 'titem on' : 'titem'}
                  aria-current={t.id === selectedId ? 'true' : undefined}
                  onClick={() => onSelect(t.id)}
                >
                  <span className="titem-name">{t.name || 'Untitled'}</span>
                  <span className="titem-meta">
                    {FOCUS_LABEL[t.focus]}, {t.skills.length} skill{t.skills.length === 1 ? '' : 's'}
                  </span>
                  <span className="mini-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (total / cap) * 100)}%` }} className={total > cap ? 'over' : ''} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {footer}
    </nav>
  )
}
