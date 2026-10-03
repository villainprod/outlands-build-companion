import { RULES, STAT_INFO, STAT_KEYS, type StatKey } from '../data/outlands'
import { statTotal, type Template } from '../lib/template'

interface Props {
  template: Template
  onChange: (t: Template) => void
}

export function StatsPanel({ template, onChange }: Props) {
  const total = statTotal(template)
  const left = RULES.statCap - total

  const set = (k: StatKey, raw: number) => {
    const v = Math.round(Math.min(RULES.statMax, Math.max(RULES.statMin, Number.isFinite(raw) ? raw : RULES.statMin)))
    onChange({ ...template, stats: { ...template.stats, [k]: v } })
  }

  return (
    <section className="panel" aria-labelledby="stats-h">
      <div className="panel-head">
        <h2 id="stats-h">Stats</h2>
        <p className={left < 0 ? 'meta over' : 'meta'}>
          {total} / {RULES.statCap}
          {left < 0 ? ` (${-left} over)` : left > 0 ? ` (${left} free)` : ''}
        </p>
      </div>
      <ul className="stats">
        {STAT_KEYS.map((k) => (
          <li key={k} className="stat">
            <div className="skill-top">
              <label htmlFor={`stat-${k}`} className="skill-name">
                {STAT_INFO[k].name}
              </label>
              <input
                className="skill-num"
                type="number"
                inputMode="numeric"
                min={RULES.statMin}
                max={RULES.statMax}
                value={template.stats[k]}
                onChange={(e) => set(k, e.target.valueAsNumber)}
                aria-label={`${STAT_INFO[k].name} value`}
              />
            </div>
            <input
              id={`stat-${k}`}
              type="range"
              min={RULES.statMin}
              max={RULES.statMax}
              value={template.stats[k]}
              onChange={(e) => set(k, e.target.valueAsNumber)}
              style={{ ['--pct' as string]: `${((template.stats[k] - RULES.statMin) / (RULES.statMax - RULES.statMin)) * 100}%` }}
            />
            <p className="hint">{STAT_INFO[k].hint}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
