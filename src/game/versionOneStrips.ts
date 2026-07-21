import type { FighterId } from './fighters'

export type VersionOneAction =
  | 'idle' | 'run' | 'jump' | 'punch' | 'kick'
  | 'roundhouse' | 'slide' | 'stagger' | 'knockdown' | 'recovery'

export type VersionOneStrip = {
  frames: number
  url: string
}

const strips: Partial<Record<FighterId, Partial<Record<VersionOneAction, VersionOneStrip>>>> = {
  agent: {
    punch: { frames: 8, url: '/assets/version1-action-strips/agent-punch.png' },
    roundhouse: { frames: 8, url: '/assets/version1-action-strips/agent-roundhouse.png' },
  },
  john: {
    punch: { frames: 8, url: '/assets/version1-action-strips/john-punch.png' },
  },
  islam: {
    punch: { frames: 8, url: '/assets/version1-action-strips/islam-punch.png' },
  },
  khabibi: {
    punch: { frames: 8, url: '/assets/version1-action-strips/khabibi-punch.png' },
  },
  conor: {
    punch: { frames: 8, url: '/assets/version1-action-strips/conor-punch.png' },
    kick: { frames: 8, url: '/assets/version1-action-strips/conor-kick.png' },
  },
}

export function getVersionOneStrip(fighter: FighterId, action: string) {
  return strips[fighter]?.[action as VersionOneAction]
}
