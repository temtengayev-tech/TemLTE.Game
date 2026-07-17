export type FighterId = 'agent' | 'officer' | 'john' | 'conor' | 'islam' | 'khabibi' | 'chalres'
export type GameMode = 'normal' | 'mma' | 'versus' | 'solo' | 'career' | 'shootout' | 'short' | 'brawl'
export type GameSetup = { mode: GameMode; player: FighterId; opponent: FighterId }
export type CombatProfile = { punch: number; kick: number; slide: number; roundhouse: number; attackSpeed: number; healthGrowth: number; staminaGrowth: number; damageGrowth: number; careerTrait: string }

export type FighterInfo = {
  id: FighterId
  name: string
  nickname: string
  sheet: string
  style: string
  speed: number
  maxHealth: number
  special: 'shoot' | 'kick'
  baseFacing: 'left' | 'right'
  traits: string[]
  story: string
  nationality: string
  flag: string
  height: string
  weight: string
  record: string
}

export const fighters: Record<FighterId, FighterInfo> = {
  agent: { id: 'agent', name: 'THE AGENT', nickname: 'THE UNKNOWN VARIABLE', sheet: 'player-frames', style: 'Unpredictable all-rounder', speed: 27, maxHealth: 250, special: 'kick', baseFacing: 'right', traits: ['Counters', 'Tricks', 'Speed'], story: 'Nobody knows his real name or where he trained. He appeared in underground fight circuits using a different alias in every city. A fast, technical fighter who studies opponents like targets, The Agent joined the tournament for reasons nobody understands.', nationality: 'Unknown', flag: '❓', height: `5'11"`, weight: '170 LB', record: '12-1-0' },
  officer: { id: 'officer', name: 'STREET GUARD', nickname: 'THE ENFORCER', sheet: 'officer-frames', style: 'Power pressure fighter', speed: 19, maxHealth: 300, special: 'kick', baseFacing: 'left', traits: ['Armoured', 'Patient', 'Power'], story: 'The undefeated guardian of Fightron Avenue. Slow and steady, he never abandons his position.', nationality: 'United States', flag: '🇺🇸', height: `6'2"`, weight: '205 LB', record: '18-4-0' },
  john: { id: 'john', name: 'JOHN BONES', nickname: 'THE PRODIGY', sheet: 'john-frames', style: 'Creative long-range fighter', speed: 16, maxHealth: 400, special: 'kick', baseFacing: 'left', traits: ['Elbows', 'Spinning Attacks', 'Wrestling'], story: 'John grew up competing with his highly successful brothers. While they became stars in other sports, John chose fighting. His unusual reach, creativity, and ruthless fight IQ made him a champion, but controversy and his reckless personality threatened his career. Now he wants to prove talent can overcome everything.', nationality: 'United States', flag: '🇺🇸', height: `6'4"`, weight: '205 LB', record: '28-1-0' },
  conor: { id: 'conor', name: 'CONOR MCDONALDS', nickname: 'THE LOUDMOUTH', sheet: 'conor-frames', style: 'Precision counter-striker', speed: 31, maxHealth: 250, special: 'kick', baseFacing: 'left', traits: ['Movement', 'Left Hand', 'High Risk'], story: 'A former construction worker from a rough neighborhood, Conor entered fighting with almost no money and an enormous ego. His predictions, insults, and confidence made crowds love or hate him. Behind the showmanship is a dangerous striker who believes every fight ends with one perfect left hand.', nationality: 'Ireland', flag: '🇮🇪', height: `5'9"`, weight: '155 LB', record: '22-6-0' },
  islam: { id: 'islam', name: 'ISLAM MACHETE', nickname: 'THE TECHNICIAN', sheet: 'islam-frames', style: 'Relentless technical grappler', speed: 25, maxHealth: 300, special: 'kick', baseFacing: 'left', traits: ['Takedowns', 'Control', 'Submissions'], story: 'Raised in a remote mountain region where wrestling was part of everyday life, Islam trained for years under an old-school combat master. Quiet and disciplined, he sees fighting as a problem to solve rather than a performance. He does not chase fame—only technical perfection.', nationality: 'Dagestan, Russia', flag: '🇷🇺', height: `5'10"`, weight: '155 LB', record: '25-1-0' },
  khabibi: { id: 'khabibi', name: 'KHABIBI NURMAGNUSMEDOV', nickname: 'THE MOUNTAIN KING', sheet: 'khabibi-frames', style: 'Extreme pressure grappler', speed: 21, maxHealth: 300, special: 'kick', baseFacing: 'left', traits: ['Ground-and-Pound', 'Chain Wrestling', 'Stamina'], story: 'Khabibi grew up wrestling older and stronger opponents in brutal mountain camps. After promising his father and coach he would become the greatest grappler alive, he built an undefeated reputation through crushing pressure. He retired at the top, but returned when a new generation claimed they could defeat him.', nationality: 'Dagestan, Russia', flag: '🇷🇺', height: `5'10"`, weight: '155 LB', record: '29-0-0' },
  chalres: { id: 'chalres', name: 'CHARLES OLIVES', nickname: 'THE SURVIVOR', sheet: 'chalres-frames', style: 'Dangerous comeback finisher', speed: 29, maxHealth: 280, special: 'kick', baseFacing: 'left', traits: ['Submissions', 'Muay Thai', 'Comebacks'], story: 'Charles grew up in poverty and was told physical problems might prevent him from becoming an athlete. He fought anyway. After painful early defeats, he rebuilt himself into one of the sport’s most dangerous finishers. Charles fights aggressively because he knows how quickly everything can disappear.', nationality: 'Brazil', flag: '🇧🇷', height: `5'10"`, weight: '155 LB', record: '34-10-0' },
}

export const combatProfiles: Record<FighterId, CombatProfile> = {
  agent: { punch: 1.08, kick: 1, slide: 1.08, roundhouse: .92, attackSpeed: 1.1, healthGrowth: 1, staminaGrowth: 1.08, damageGrowth: 1, careerTrait: 'Fast counters, improved punch timing and balanced conditioning.' },
  officer: { punch: 1.25, kick: .82, slide: .88, roundhouse: 1, attackSpeed: .82, healthGrowth: 1.3, staminaGrowth: .85, damageGrowth: 1.05, careerTrait: 'Heavy punches and major health growth, but slower combinations and weaker kicks.' },
  john: { punch: 1.15, kick: 1.08, slide: .9, roundhouse: 1.22, attackSpeed: .94, healthGrowth: 1.15, staminaGrowth: 1, damageGrowth: 1.08, careerTrait: 'Long-range strikes and dangerous roundhouses improve faster than his slide.' },
  conor: { punch: 1.3, kick: .78, slide: 1.22, roundhouse: .76, attackSpeed: 1.25, healthGrowth: .9, staminaGrowth: 1.08, damageGrowth: 1.12, careerTrait: 'Smaller and explosive: faster, stronger punches and slides, but weaker kicks and roundhouses.' },
  islam: { punch: .92, kick: 1, slide: 1.18, roundhouse: .84, attackSpeed: 1.02, healthGrowth: 1.08, staminaGrowth: 1.22, damageGrowth: 1, careerTrait: 'Efficient pressure, strong slides and excellent stamina development.' },
  khabibi: { punch: 1.12, kick: .84, slide: 1.28, roundhouse: .72, attackSpeed: .9, healthGrowth: 1.2, staminaGrowth: 1.3, damageGrowth: 1.05, careerTrait: 'Elite pressure: powerful punches, best slide and stamina growth, weak spinning attacks.' },
  chalres: { punch: 1, kick: 1.16, slide: 1.02, roundhouse: 1.17, attackSpeed: 1.1, healthGrowth: .95, staminaGrowth: 1.12, damageGrowth: 1.08, careerTrait: 'Creative finisher with sharp kicks and roundhouses, but lower health growth.' },
}

export const modeFighters = (mode: GameMode) => mode === 'career'
  ? [fighters.agent, fighters.officer, fighters.conor, fighters.islam, fighters.khabibi, fighters.chalres]
  : ['mma', 'shootout', 'short', 'brawl'].includes(mode) ? [fighters.agent, fighters.officer, fighters.john, fighters.conor, fighters.islam, fighters.khabibi, fighters.chalres] : Object.values(fighters)
