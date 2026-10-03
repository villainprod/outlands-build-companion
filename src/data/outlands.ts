// Game rules and skill list for UO Outlands.
// Source: https://wiki.uooutlands.com/Skills_%26_Stats and
//         https://wiki.uooutlands.com/Skill_Mastery
// If the shard changes a number, this is the only file to update.

export const RULES = {
  /** Starting total skill cap. */
  baseSkillCap: 700,
  /** Each Skill Mastery Orb raises the total cap by 1, up to this many. */
  maxMasteryOrbs: 20,
  /** Normal per-skill maximum. */
  skillSoftMax: 100,
  /** Per-skill maximum reachable with Skill Mastery Scrolls (non-PvP skills). */
  skillHardMax: 120,
  /** Total stat cap across Str/Dex/Int. */
  statCap: 225,
  /** Per-stat bounds (standard UO values for a 225 stat cap). */
  statMin: 10,
  statMax: 100,
} as const

export type CategoryId =
  | 'combat'
  | 'magic'
  | 'bard'
  | 'thieving'
  | 'trade'
  | 'wilderness'
  | 'misc'

export interface Category {
  id: CategoryId
  name: string
  skills: string[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'combat',
    name: 'Combat',
    skills: [
      'Anatomy', 'Archery', 'Chivalry', 'Dual Wielding', 'Fencing', 'Healing',
      'Mace Fighting', 'Parrying', 'Swordsmanship', 'Tactics', 'Throwing', 'Wrestling',
    ],
  },
  {
    id: 'magic',
    name: 'Magic',
    skills: [
      'Arcane', 'Evaluating Intelligence', 'Magery', 'Meditation', 'Necromancy',
      'Resisting Spells', 'Spirit Speak',
    ],
  },
  {
    id: 'bard',
    name: 'Bard',
    skills: ['Discordance', 'Musicianship', 'Peacemaking', 'Provocation'],
  },
  {
    id: 'thieving',
    name: 'Thieving',
    skills: [
      'Detecting Hidden', 'Hiding', 'Lockpicking', 'Poisoning', 'Snooping',
      'Stealing', 'Stealth',
    ],
  },
  {
    id: 'trade',
    name: 'Trade',
    skills: [
      'Alchemy', 'Blacksmithy', 'Carpentry', 'Cartography', 'Cooking', 'Fishing',
      'Inscription', 'Lumberjacking', 'Mining', 'Tailoring', 'Tinkering',
    ],
  },
  {
    id: 'wilderness',
    name: 'Wilderness',
    skills: [
      'Animal Lore', 'Animal Taming', 'Camping', 'Forensic Evaluation', 'Herding',
      'Tracking', 'Veterinary',
    ],
  },
  {
    id: 'misc',
    name: 'Misc',
    skills: ['Arms Lore', 'Begging', 'Focus', 'Item Identification', 'Taste Identification'],
  },
]

const SKILL_CATEGORY = new Map<string, CategoryId>(
  CATEGORIES.flatMap((c) => c.skills.map((s) => [s, c.id] as const)),
)

export const ALL_SKILLS = CATEGORIES.flatMap((c) => c.skills)

export function categoryOf(skill: string): CategoryId {
  return SKILL_CATEGORY.get(skill) ?? 'misc'
}

export function isKnownSkill(skill: string): boolean {
  return SKILL_CATEGORY.has(skill)
}

export const STAT_KEYS = ['str', 'dex', 'int'] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_INFO: Record<StatKey, { name: string; hint: string }> = {
  str: { name: 'Strength', hint: 'Hit points' },
  dex: { name: 'Dexterity', hint: 'Stamina, bandage speed and swing speed (benefits cap at 100)' },
  int: { name: 'Intelligence', hint: 'Mana' },
}
