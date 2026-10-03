// Shapes for the future "live damage stats" feature.
// Nothing produces these yet. Whatever ends up feeding the app
// (a pasted/uploaded combat log, a companion script, or a shared
// community dataset) should convert its input into DamageEvent[]
// so the rest of the app only deals with one format.

export interface DamageEvent {
  /** Milliseconds since the start of the fight/session. */
  t: number
  source: 'player' | 'pet' | 'summon' | 'other'
  /** Weapon, spell or ability name, e.g. "Energy Bolt" or "Bow". */
  ability: string
  target?: string
  amount: number
  crit?: boolean
}

export interface FightSummary {
  templateId?: string
  durationMs: number
  totalDamage: number
  dps: number
  byAbility: Record<string, { hits: number; total: number }>
}

export function summarize(events: DamageEvent[], templateId?: string): FightSummary {
  if (events.length === 0) return { templateId, durationMs: 0, totalDamage: 0, dps: 0, byAbility: {} }
  const start = Math.min(...events.map((e) => e.t))
  const end = Math.max(...events.map((e) => e.t))
  const durationMs = Math.max(1000, end - start)
  const byAbility: FightSummary['byAbility'] = {}
  let totalDamage = 0
  for (const e of events) {
    totalDamage += e.amount
    const a = (byAbility[e.ability] ??= { hits: 0, total: 0 })
    a.hits += 1
    a.total += e.amount
  }
  return { templateId, durationMs, totalDamage, dps: totalDamage / (durationMs / 1000), byAbility }
}
