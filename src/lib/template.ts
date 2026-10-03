import { RULES, STAT_KEYS, isKnownSkill, type StatKey } from '../data/outlands'

export interface SkillEntry {
  name: string
  /** 0 – 120, one decimal place, like the in-game skill window. */
  value: number
}

export type Focus = 'pvm' | 'pvp' | 'both' | 'crafting'

export interface Template {
  id: string
  name: string
  focus: Focus
  skills: SkillEntry[]
  stats: Record<StatKey, number>
  /** Skill Mastery Orbs used (each adds 1 to the total skill cap). */
  masteryOrbs: number
  notes: string
  updatedAt: number
}

export const FOCUS_LABEL: Record<Focus, string> = {
  pvm: 'PvM',
  pvp: 'PvP',
  both: 'Both',
  crafting: 'Crafter',
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function blankTemplate(name = 'New template'): Template {
  return {
    id: newId(),
    name,
    focus: 'pvm',
    skills: [],
    stats: { str: 100, dex: 25, int: 100 },
    masteryOrbs: 0,
    notes: '',
    updatedAt: Date.now(),
  }
}

export const EXAMPLE_NOTE = 'Example template. Edit, duplicate or delete it.'

export function exampleTemplates(): Template[] {
  const now = Date.now()
  return [
    {
      id: newId(),
      name: 'Tank mage',
      focus: 'both',
      skills: [
        { name: 'Magery', value: 100 },
        { name: 'Evaluating Intelligence', value: 100 },
        { name: 'Meditation', value: 100 },
        { name: 'Resisting Spells', value: 100 },
        { name: 'Wrestling', value: 100 },
        { name: 'Tactics', value: 100 },
        { name: 'Anatomy', value: 100 },
      ],
      stats: { str: 100, dex: 25, int: 100 },
      masteryOrbs: 0,
      notes: EXAMPLE_NOTE,
      updatedAt: now,
    },
    {
      id: newId(),
      name: 'Archer dexxer',
      focus: 'pvm',
      skills: [
        { name: 'Archery', value: 100 },
        { name: 'Tactics', value: 100 },
        { name: 'Anatomy', value: 100 },
        { name: 'Healing', value: 100 },
        { name: 'Parrying', value: 100 },
        { name: 'Resisting Spells', value: 100 },
        { name: 'Arms Lore', value: 100 },
      ],
      stats: { str: 100, dex: 100, int: 25 },
      masteryOrbs: 0,
      notes: EXAMPLE_NOTE,
      updatedAt: now - 1,
    },
  ]
}

// ---------- derived numbers ----------

export function skillCap(t: Template): number {
  return RULES.baseSkillCap + t.masteryOrbs
}

export function skillTotal(t: Template): number {
  return round1(t.skills.reduce((sum, s) => sum + s.value, 0))
}

export function statTotal(t: Template): number {
  return STAT_KEYS.reduce((sum, k) => sum + t.stats[k], 0)
}

/** Mastery scrolls needed to raise one skill's cap to cover `value`. */
export function scrollsNeeded(value: number): number {
  return Math.max(0, Math.ceil(value - RULES.skillSoftMax))
}

export function totalScrollsNeeded(t: Template): number {
  return t.skills.reduce((sum, s) => sum + scrollsNeeded(s.value), 0)
}

export interface Problem {
  level: 'error' | 'warn'
  text: string
}

export function problems(t: Template): Problem[] {
  const out: Problem[] = []
  const total = skillTotal(t)
  const cap = skillCap(t)
  if (total > cap) out.push({ level: 'error', text: `Skills are ${round1(total - cap)} over the ${cap} cap.` })
  const st = statTotal(t)
  if (st > RULES.statCap) out.push({ level: 'error', text: `Stats are ${st - RULES.statCap} over the ${RULES.statCap} cap.` })
  const scrolls = totalScrollsNeeded(t)
  if (scrolls > 0) out.push({ level: 'warn', text: `Needs ${scrolls} Skill Mastery Scroll${scrolls === 1 ? '' : 's'} to go above 100.` })
  return out
}

// ---------- sanitising (for imports and share links) ----------

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/** Turns untrusted JSON into a valid Template, or returns null. */
export function sanitize(raw: unknown): Template | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const base = blankTemplate()
  const focus = (['pvm', 'pvp', 'both', 'crafting'] as const).includes(r.focus as Focus)
    ? (r.focus as Focus)
    : base.focus
  const seen = new Set<string>()
  const skills: SkillEntry[] = Array.isArray(r.skills)
    ? r.skills
        .map((s) => s as Record<string, unknown>)
        .filter((s) => typeof s?.name === 'string' && isKnownSkill(s.name) && !seen.has(s.name) && seen.add(s.name))
        .map((s) => ({ name: s.name as string, value: round1(clamp(num(s.value, 0), 0, RULES.skillHardMax)) }))
    : []
  const rs = (r.stats ?? {}) as Record<string, unknown>
  const stats = Object.fromEntries(
    STAT_KEYS.map((k) => [k, Math.round(clamp(num(rs[k], base.stats[k]), RULES.statMin, RULES.statMax))]),
  ) as Record<StatKey, number>
  return {
    id: typeof r.id === 'string' && r.id ? r.id.slice(0, 40) : base.id,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 80) : 'Imported template',
    focus,
    skills,
    stats,
    masteryOrbs: Math.round(clamp(num(r.masteryOrbs, 0), 0, RULES.maxMasteryOrbs)),
    notes: typeof r.notes === 'string' ? r.notes.slice(0, 4000) : '',
    updatedAt: Date.now(),
  }
}

// ---------- share links ----------
// Templates are encoded into the URL hash, so sharing needs no server.

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function encodeShare(t: Template): string {
  const payload = {
    v: 1,
    name: t.name,
    focus: t.focus,
    skills: t.skills.map((s) => [s.name, s.value]),
    stats: [t.stats.str, t.stats.dex, t.stats.int],
    masteryOrbs: t.masteryOrbs,
    notes: t.notes,
  }
  return toBase64Url(JSON.stringify(payload))
}

export function decodeShare(code: string): Template | null {
  try {
    const p = JSON.parse(fromBase64Url(code))
    if (!p || p.v !== 1) return null
    return sanitize({
      name: p.name,
      focus: p.focus,
      skills: Array.isArray(p.skills) ? p.skills.map((s: [string, number]) => ({ name: s?.[0], value: s?.[1] })) : [],
      stats: Array.isArray(p.stats) ? { str: p.stats[0], dex: p.stats[1], int: p.stats[2] } : undefined,
      masteryOrbs: p.masteryOrbs,
      notes: p.notes,
    })
  } catch {
    return null
  }
}

export function shareUrl(t: Template): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#share=${encodeShare(t)}`
}
