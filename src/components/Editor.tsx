import type { ReactNode } from 'react'
import { RULES } from '../data/outlands'
import { FOCUS_LABEL, problems, type Focus, type Template } from '../lib/template'
import { BudgetBar } from './BudgetBar'
import { SkillList } from './SkillList'
import { StatsPanel } from './StatsPanel'

interface Props {
  template: Template
  onChange: (t: Template) => void
  onShare: () => void
  onExport: () => void
  onDuplicate: () => void
  onDelete: () => void
  readOnly?: boolean
  /** Shown beside the action buttons, e.g. the cloud save state. */
  status?: ReactNode
}

export function Editor({ template, onChange, onShare, onExport, onDuplicate, onDelete, readOnly, status }: Props) {
  const issues = problems(template)

  return (
    <div className="editor">
      <header className="editor-head">
        <label className="name-field">
          <span className="sr-only">Template name</span>
          <input
            className="name-input"
            value={template.name}
            maxLength={80}
            onChange={(e) => onChange({ ...template, name: e.target.value })}
          />
        </label>

        <div className="head-controls">
          <div className="segmented" role="radiogroup" aria-label="Template focus">
            {(Object.keys(FOCUS_LABEL) as Focus[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={template.focus === f}
                className={template.focus === f ? 'on' : ''}
                onClick={() => onChange({ ...template, focus: f })}
              >
                {FOCUS_LABEL[f]}
              </button>
            ))}
          </div>

          <label className="orbs">
            Mastery orbs
            <input
              type="number"
              min={0}
              max={RULES.maxMasteryOrbs}
              value={template.masteryOrbs}
              onChange={(e) =>
                onChange({
                  ...template,
                  masteryOrbs: Math.min(RULES.maxMasteryOrbs, Math.max(0, Math.round(e.target.valueAsNumber || 0))),
                })
              }
            />
          </label>
        </div>
      </header>

      <BudgetBar template={template} />

      {issues.length > 0 && (
        <ul className="issues" aria-live="polite">
          {issues.map((p) => (
            <li key={p.text} className={p.level}>
              {p.text}
            </li>
          ))}
        </ul>
      )}

      <div className="editor-grid">
        <SkillList template={template} onChange={onChange} />
        <div className="side-col">
          <StatsPanel template={template} onChange={onChange} />
          <section className="panel" aria-labelledby="notes-h">
            <div className="panel-head">
              <h2 id="notes-h">Notes</h2>
            </div>
            <textarea
              className="notes"
              rows={5}
              maxLength={4000}
              placeholder="Gear, suit, playstyle, training order…"
              value={template.notes}
              onChange={(e) => onChange({ ...template, notes: e.target.value })}
            />
          </section>
        </div>
      </div>

      {!readOnly && (
        <footer className="actions">
          <button type="button" className="primary" onClick={onShare}>
            Copy share link
          </button>
          <button type="button" onClick={onExport}>
            Export JSON
          </button>
          <button type="button" onClick={onDuplicate}>
            Duplicate
          </button>
          {status}
          <button type="button" className="danger" onClick={onDelete}>
            Delete
          </button>
        </footer>
      )}
    </div>
  )
}
