import type { CareerFightResult } from '../components/FightronGame'

export type CareerInjury = {
  name: string
  detail: string
  healthPenalty: number
  staminaPenalty: number
  damagePenalty: number
  fightsRemaining: number
}

export type CareerCondition = {
  fatigue: number
  injury: CareerInjury | null
}

const injuries: CareerInjury[] = [
  { name: 'BRUISED RIBS', detail: 'Body impact reduces power and breathing.', healthPenalty: .08, staminaPenalty: .08, damagePenalty: .12, fightsRemaining: 1 },
  { name: 'SPRAINED KNEE', detail: 'Movement injury reduces stamina and kicking force.', healthPenalty: .04, staminaPenalty: .18, damagePenalty: .08, fightsRemaining: 1 },
  { name: 'SWOLLEN EYE', detail: 'Reduced vision lowers timing and total damage.', healthPenalty: .06, staminaPenalty: .04, damagePenalty: .15, fightsRemaining: 1 },
  { name: 'SORE SHOULDER', detail: 'Punching and grappling power are reduced.', healthPenalty: .03, staminaPenalty: .07, damagePenalty: .18, fightsRemaining: 1 },
]

export const freshCondition: CareerCondition = { fatigue: 0, injury: null }

export function conditionAfterFight(current: CareerCondition, fight: CareerFightResult, event: number): CareerCondition {
  const lengthLoad = Math.min(65, Math.round(fight.durationSeconds / 60 * 55))
  const damageLoad = Math.round(fight.damageTakenRatio * 35)
  const fatigue = Math.min(100, Math.round(current.fatigue * .35 + lengthLoad + damageLoad))
  const oldInjury = current.injury?.fightsRemaining ? { ...current.injury, fightsRemaining: current.injury.fightsRemaining - 1 } : null
  const injuryRisk = fight.damageTakenRatio * 70 + fight.durationSeconds * .32 + (fight.won ? 0 : 12)
  const injury = injuryRisk >= 38 ? injuries[(event + fight.finishRound + Math.round(fight.durationSeconds)) % injuries.length] : oldInjury?.fightsRemaining ? oldInjury : null
  return { fatigue, injury }
}

export function recoverCondition(current: CareerCondition, fullRest = false): CareerCondition {
  const injury = current.injury && fullRest ? null : current.injury
  return { fatigue: Math.max(0, current.fatigue - (fullRest ? 65 : 28)), injury }
}

export function conditionMultipliers(condition: CareerCondition) {
  const injury = condition.injury
  return {
    health: Math.max(.65, 1 - (injury?.healthPenalty ?? 0)),
    stamina: Math.max(.55, 1 - condition.fatigue * .003 - (injury?.staminaPenalty ?? 0)),
    damage: Math.max(.6, 1 - condition.fatigue * .0015 - (injury?.damagePenalty ?? 0)),
  }
}
