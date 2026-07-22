import type { FighterId } from './fighters'

export type VersionOneAction =
  | 'idle' | 'run' | 'jump' | 'punch' | 'kick'
  | 'roundhouse' | 'slide' | 'stagger' | 'knockdown' | 'recovery'

export type VersionOneStrip = {
  frames: number
  url: string
}

const strips: Partial<Record<FighterId, Partial<Record<VersionOneAction, VersionOneStrip>>>> = {
  agent: actionSet('agent'),
  john: {
    idle: { frames: 8, url: '/assets/version1-action-strips/john-idle.png' },
    run: { frames: 8, url: '/assets/version1-action-strips/john-run.png' },
    jump: { frames: 8, url: '/assets/version1-action-strips/john-jump.png' },
    punch: { frames: 12, url: '/assets/version1-action-strips/john-punch.png' },
    kick: { frames: 12, url: '/assets/version1-action-strips/john-kick.png' },
    roundhouse: { frames: 12, url: '/assets/version1-action-strips/john-roundhouse.png' },
    slide: { frames: 12, url: '/assets/version1-action-strips/john-slide.png' },
    stagger: { frames: 8, url: '/assets/version1-action-strips/john-stagger.png' },
    knockdown: { frames: 12, url: '/assets/version1-action-strips/john-knockdown.png' },
    recovery: { frames: 8, url: '/assets/version1-action-strips/john-recovery.png' },
  },
  islam: actionSet('islam'),
  khabibi: {
    idle: { frames: 8, url: '/assets/version1-action-strips/khabibi-idle.png' },
    run: { frames: 8, url: '/assets/version1-action-strips/khabibi-run.png' },
    jump: { frames: 8, url: '/assets/version1-action-strips/khabibi-jump.png' },
    punch: { frames: 8, url: '/assets/version1-action-strips/khabibi-punch.png' },
    kick: { frames: 8, url: '/assets/version1-action-strips/khabibi-kick.png' },
    roundhouse: { frames: 8, url: '/assets/version1-action-strips/khabibi-roundhouse.png' },
    slide: { frames: 8, url: '/assets/version1-action-strips/khabibi-slide.png' },
    stagger: { frames: 8, url: '/assets/version1-action-strips/khabibi-stagger.png' },
    knockdown: { frames: 16, url: '/assets/version1-action-strips/khabibi-knockdown.png' },
    recovery: { frames: 8, url: '/assets/version1-action-strips/khabibi-recovery.png' },
  },
  conor: {
    idle: { frames: 8, url: '/assets/version1-action-strips/conor-idle.png' },
    run: { frames: 8, url: '/assets/version1-action-strips/conor-run.png' },
    jump: { frames: 8, url: '/assets/version1-action-strips/conor-jump.png' },
    punch: { frames: 12, url: '/assets/version1-action-strips/conor-punch.png' },
    kick: { frames: 12, url: '/assets/version1-action-strips/conor-kick.png' },
    roundhouse: { frames: 12, url: '/assets/version1-action-strips/conor-roundhouse.png' },
    slide: { frames: 12, url: '/assets/version1-action-strips/conor-slide.png' },
    stagger: { frames: 8, url: '/assets/version1-action-strips/conor-stagger.png' },
    knockdown: { frames: 12, url: '/assets/version1-action-strips/conor-knockdown.png' },
    recovery: { frames: 8, url: '/assets/version1-action-strips/conor-recovery.png' },
  },
  officer: actionSet('officer'),
  chalres: actionSet('chalres'),
  max: actionSet('max'),
  ilia: actionSet('ilia'),
  daniel: actionSet('daniel'),
}

function actionSet(fighter: FighterId, extended = false): Partial<Record<VersionOneAction, VersionOneStrip>> {
  const strip = (action: VersionOneAction, frames = 8): VersionOneStrip => ({
    frames,
    url: `/assets/version1-action-strips/${fighter}-${action}.png`,
  })
  return {
    idle: strip('idle'),
    run: strip('run'),
    jump: strip('jump'),
    punch: strip('punch', extended ? 12 : 8),
    kick: strip('kick', extended ? 12 : 8),
    roundhouse: strip('roundhouse', extended ? 12 : 8),
    slide: strip('slide', extended ? 12 : 8),
    stagger: strip('stagger'),
    knockdown: strip('knockdown', extended ? 12 : 16),
    recovery: strip('recovery'),
  }
}

export function getVersionOneStrip(fighter: FighterId, action: string) {
  const normalizedAction = action === 'hardKnockdown' || action === 'missKnockdown'
    ? 'knockdown'
    : action
  return strips[fighter]?.[normalizedAction as VersionOneAction]
}

export function getVersionOneDesignUrl(fighter: FighterId) {
  const suffix = fighter === 'john' || fighter === 'conor' || fighter === 'agent'
    || fighter === 'officer' || fighter === 'islam'
    ? '-v1'
    : ''
  return `/assets/${fighter}-menu-fighter${suffix}.png`
}
