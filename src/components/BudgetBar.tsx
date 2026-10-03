import { categoryOf } from '../data/outlands'
import { round1, skillCap, skillTotal, type Template } from '../lib/template'

/** The 700-point skill budget, drawn as one bar split by skill. */
export function BudgetBar({ template }: { template: Template }) {
  const cap = skillCap(template)
  const total = skillTotal(template)
  const scale = Math.max(cap, total)
  const remaining = round1(cap - total)
  const over = remaining < 0

  return (
    <section className="budget" aria-label="Skill points">
      <div className="budget-figures">
        <p className="budget-total">
          <span className={over ? 'num over' : 'num'}>{total.toFixed(1)}</span>
          <span className="of"> of {cap}</span>
        </p>
        <p className={over ? 'budget-left over' : 'budget-left'}>
          {over ? `${Math.abs(remaining).toFixed(1)} over cap` : `${remaining.toFixed(1)} points free`}
        </p>
      </div>

      <div className="bar" role="img" aria-label={`${total} of ${cap} skill points used`}>
        {template.skills
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.name}
              className={`seg cat-${categoryOf(s.name)}`}
              style={{ flexGrow: s.value, flexBasis: 0 }}
              title={`${s.name}: ${s.value.toFixed(1)}`}
            >
              <span className="seg-label">{abbreviate(s.name)}</span>
            </div>
          ))}
        {!over && remaining > 0 && (
          <div className="seg free" style={{ flexGrow: remaining, flexBasis: 0 }} />
        )}
        {over && <div className="cap-marker" style={{ left: `${(cap / scale) * 100}%` }} />}
      </div>
    </section>
  )
}

function abbreviate(name: string): string {
  const words = name.split(' ')
  if (words.length > 1) return words.map((w) => w[0]).join('')
  return name.slice(0, 4)
}
