import { CATEGORIES, RULES, categoryOf } from '../data/outlands'
import { round1, scrollsNeeded, skillCap, skillTotal, type Template } from '../lib/template'

interface Props {
  template: Template
  onChange: (t: Template) => void
}

export function SkillList({ template, onChange }: Props) {
  const chosen = new Set(template.skills.map((s) => s.name))
  const free = round1(skillCap(template) - skillTotal(template))

  const setValue = (name: string, raw: number) => {
    const value = round1(Math.min(RULES.skillHardMax, Math.max(0, Number.isFinite(raw) ? raw : 0)))
    onChange({ ...template, skills: template.skills.map((s) => (s.name === name ? { ...s, value } : s)) })
  }

  const add = (name: string) => {
    if (!name || chosen.has(name)) return
    const value = round1(Math.max(0, Math.min(RULES.skillSoftMax, free)))
    onChange({ ...template, skills: [...template.skills, { name, value }] })
  }

  const remove = (name: string) =>
    onChange({ ...template, skills: template.skills.filter((s) => s.name !== name) })

  return (
    <section className="panel" aria-labelledby="skills-h">
      <div className="panel-head">
        <h2 id="skills-h">Skills</h2>
        <label className="add-skill">
          <span className="sr-only">Add a skill</span>
          <select value="" onChange={(e) => add(e.target.value)}>
            <option value="">Add a skill…</option>
            {CATEGORIES.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {c.skills
                  .filter((s) => !chosen.has(s))
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {template.skills.length === 0 ? (
        <p className="empty">Pick a skill above to start spending your {skillCap(template)} points.</p>
      ) : (
        <ul className="skills">
          {template.skills.map((s) => {
            const scrolls = scrollsNeeded(s.value)
            const id = `skill-${s.name.replace(/\s/g, '-')}`
            const fill = round1(Math.min(RULES.skillSoftMax, s.value + Math.max(0, free)))
            return (
              <li key={s.name} className="skill">
                <div className="skill-top">
                  <label htmlFor={id} className="skill-name">
                    <span className={`dot cat-${categoryOf(s.name)}`} aria-hidden="true" />
                    {s.name}
                  </label>
                  {scrolls > 0 && <span className="pill warn">{scrolls} scroll{scrolls === 1 ? '' : 's'}</span>}
                  <input
                    className="skill-num"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={RULES.skillHardMax}
                    step={0.1}
                    value={s.value}
                    onChange={(e) => setValue(s.name, e.target.valueAsNumber)}
                    aria-label={`${s.name} value`}
                  />
                </div>
                <div className="skill-bottom">
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={RULES.skillHardMax}
                    step={0.1}
                    value={s.value}
                    onChange={(e) => setValue(s.name, e.target.valueAsNumber)}
                    style={{ ['--pct' as string]: `${(s.value / RULES.skillHardMax) * 100}%` }}
                  />
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => setValue(s.name, fill)}
                    disabled={fill <= s.value}
                    title="Raise to 100, or as far as free points allow"
                  >
                    Fill
                  </button>
                  <button type="button" className="ghost small" onClick={() => remove(s.name)} aria-label={`Remove ${s.name}`}>
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
