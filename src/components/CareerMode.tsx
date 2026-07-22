import { useEffect, useMemo, useState } from 'react'
import { combatProfiles, fighters, type FighterId, type GameSetup } from '../game/fighters'
import { CareerNews } from './CareerNews'
import { CareerHeadquarters } from './CareerHeadquarters'
import { updateCareerSave, type CareerSave } from '../lib/careerSaves'
import { FightronGame, type CareerFightResult, type CareerUpgrades } from './FightronGame'
import { CareerFightWeek } from './CareerFightWeek'
import { CareerWeekendRecovery } from './CareerWeekendRecovery'
import { conditionAfterFight, conditionMultipliers, freshCondition, recoverCondition, type CareerCondition } from '../lib/careerCondition'

const roster = Object.keys(fighters) as FighterId[]
const startingPoints: Record<FighterId, number> = { john: 80, khabibi: 62, islam: 54, ilia: 51, chalres: 47, max: 44, conor: 40, daniel: 37, agent: 32, officer: 25 }
export type CareerResult = { id: string; event: number; winner: FighterId; loser: FighterId; detail: string; points: number; purse: number; playerFight: boolean; upset: boolean; titleChange: boolean }
type UpgradeKey = keyof CareerUpgrades
const upgradeInfo: Record<UpgradeKey, { label: string; cost: number; gain: string }> = { health: { label: 'HEALTH', cost: 6000, gain: '+20 HP' }, stamina: { label: 'STAMINA', cost: 5500, gain: '+15 stamina' }, damage: { label: 'DAMAGE', cost: 8000, gain: '+3 all damage' }, slide: { label: 'SLIDE', cost: 7000, gain: '+5 slide damage' }, roundhouse: { label: 'ROUNDHOUSE', cost: 7500, gain: '+0.2s stun' } }

function simulateEvent(event: number, excluded: FighterId[], championId: FighterId) {
  const available = roster.filter(id => !excluded.includes(id)); const shift = event % Math.max(1, available.length)
  const rotated = [...available.slice(shift), ...available.slice(0, shift)]
  const resting = rotated.length % 2 ? rotated.pop() ?? null : excluded.length === 1 ? excluded[0] : null
  const results: CareerResult[] = []
  for (let index = 0; index < rotated.length; index += 2) {
    const first = rotated[index]; const second = rotated[index + 1]
    const firstGrowth = combatProfiles[first].damageGrowth + combatProfiles[first].healthGrowth + combatProfiles[first].staminaGrowth
    const secondGrowth = combatProfiles[second].damageGrowth + combatProfiles[second].healthGrowth + combatProfiles[second].staminaGrowth
    const firstPower = startingPoints[first] + event * firstGrowth; const secondPower = startingPoints[second] + event * secondGrowth
    const favorite = firstPower >= secondPower ? first : second; const underdog = favorite === first ? second : first
    const upset = (event * 29 + index * 19 + fighters[underdog].speed) % 100 < 24; const winner = upset ? underdog : favorite
    const knockout = (event + index) % 2 === 0; const points = knockout ? 13 : 10; const loser = winner === first ? second : first
    results.push({ id: `${event}-${first}-${second}`, event, winner, loser, detail: knockout ? `KO · ROUND ${1 + (event + index) % 3}` : 'DECISION · 2–1', points, purse: 5000 + Math.max(startingPoints[first], startingPoints[second]) * 120 + event * 500, playerFight: false, upset, titleChange: loser === championId })
  }
  return { results, resting }
}

export function CareerMode({ fighterId, save, onExit }: { fighterId: FighterId; save: CareerSave; onExit: () => void }) {
  const saved = save.state
  const [event, setEvent] = useState(Number(saved.event ?? 1)); const [fighting, setFighting] = useState(false); const [fightWeek, setFightWeek] = useState(false); const [showNews, setShowNews] = useState(false)
  const [opponent, setOpponent] = useState<FighterId | null>((saved.opponent as FighterId | null) ?? null); const [results, setResults] = useState<CareerResult[]>((saved.results as CareerResult[] | undefined) ?? [])
  const [championId, setChampionId] = useState<FighterId>((saved.championId as FighterId | undefined) ?? 'john'); const [resting, setResting] = useState<FighterId | null>((saved.resting as FighterId | null) ?? null)
  const [contractMessage, setContractMessage] = useState(String(saved.contractMessage ?? 'Send a fight request, visit FCB News, train, or rest this event.'))
  const [upgrades, setUpgrades] = useState<CareerUpgrades>((saved.upgrades as CareerUpgrades | undefined) ?? { health: 0, stamina: 0, damage: 0, slide: 0, roundhouse: 0 }); const [spent, setSpent] = useState(Number(saved.spent ?? 0))
  const [fanHype, setFanHype] = useState(Number(saved.fanHype ?? 35))
  const [condition, setCondition] = useState<CareerCondition>((saved.condition as CareerCondition | undefined) ?? freshCondition)
  const [weekendResult, setWeekendResult] = useState<CareerFightResult | null>(null)
  useEffect(() => { const timer = window.setTimeout(() => { void updateCareerSave(save.id, fighterId, { event, opponent, results, championId, resting, contractMessage, upgrades, spent, fanHype, condition }) }, 500); return () => window.clearTimeout(timer) }, [championId, condition, contractMessage, event, fanHype, fighterId, opponent, resting, results, save.id, spent, upgrades])
  const standings = useMemo(() => { const scores = new Map<FighterId, number>(roster.map(id => [id, startingPoints[id]])); results.forEach(result => scores.set(result.winner, (scores.get(result.winner) ?? 0) + result.points)); return [...scores.entries()].sort((a, b) => b[1] - a[1]) }, [results])
  const earnings = results.filter(result => result.playerFight).reduce((sum, result) => sum + result.purse, 0); const cash = earnings - spent
  const playerRank = standings.findIndex(([id]) => id === fighterId); const choices = standings.map(([id]) => id).filter(id => id !== fighterId && (id !== championId || playerRank < 3 || championId === fighterId))
  const opponentRank = opponent ? standings.findIndex(([id]) => id === opponent) : -1; const rankReward = opponent ? Math.max(4, Math.min(22, 10 + (playerRank - opponentRank) * 3)) : 0
  const purse = opponent ? 5000 + (standings.length - opponentRank) * 2500 + event * 500 : 0; const titleFight = Boolean(opponent) && (opponent === championId || championId === fighterId)
  const setup: GameSetup | null = opponent ? { mode: 'career', player: fighterId, opponent } : null
  const applyCard = (card: ReturnType<typeof simulateEvent>) => { const change = card.results.find(result => result.titleChange); setResults(current => [...current, ...card.results]); setResting(card.resting); if (change) setChampionId(change.winner) }
  const restEvent = () => { applyCard(simulateEvent(event, [fighterId], championId)); setCondition(current => recoverCondition(current, true)); setFanHype(value => Math.max(0, value - 3)); setContractMessage(`You rested at Event ${event}. Your injury and fatigue recovered, but inactivity cost 3 hype.`); setOpponent(null); setEvent(value => value + 1) }
  const buy = (key: UpgradeKey) => { const item = upgradeInfo[key]; const cost = item.cost * (upgrades[key] + 1); if (cash < cost || upgrades[key] >= 5) return; setSpent(value => value + cost); setUpgrades(current => ({ ...current, [key]: current[key] + 1 })) }
  const request = (id: FighterId) => { const rank = standings.findIndex(([ranked]) => ranked === id); const chance = rank >= playerRank ? 82 : Math.max(38, 68 + (rank - playerRank) * 8); const accepted = (event * 37 + fighters[id].speed * 7 + rank * 11) % 100 < chance; setOpponent(accepted ? id : null); setContractMessage(accepted ? `${fighters[id].name} accepted the contract.` : `${fighters[id].name} declined. Choose another opponent or rest.`) }

  const finishCareerWeek = (fight: CareerFightResult) => {
    if (!setup) return
    const points = (fight.won ? rankReward : 10) + (fight.method === 'knockout' ? 3 : 0); const loser = fight.won ? setup.opponent : fighterId
    const detail = fight.method === 'knockout' ? `KO · ROUND ${fight.finishRound}` : `${Math.max(fight.playerRounds, fight.opponentRounds)}–${Math.min(fight.playerRounds, fight.opponentRounds)} DECISION`
    const card = simulateEvent(event, [fighterId, setup.opponent], championId); const titleChange = titleFight && fight.winner !== championId
    setResults(current => [...current, { id: `${event}-player`, event, winner: fight.winner, loser, detail, points, purse, playerFight: true, upset: fight.won && opponentRank < playerRank, titleChange }, ...card.results]); setResting(card.resting)
    if (titleFight) setChampionId(fight.winner); else { const change = card.results.find(result => result.titleChange); if (change) setChampionId(change.winner) }
    setCondition(current => conditionAfterFight(current, fight, event))
    setFanHype(value => Math.max(0, Math.min(100, value + (fight.won ? fight.method === 'knockout' ? 12 : 7 : -12))))
    setEvent(value => value + 1); setOpponent(null); setWeekendResult(null)
  }

  if (fightWeek && opponent) return <CareerFightWeek fighter={fighterId} opponent={opponent} event={event} onCancel={() => setFightWeek(false)} onHype={amount => setFanHype(value => Math.max(0, Math.min(100, value + amount)))} onReady={() => { setFightWeek(false); setFighting(true) }} />

  if (weekendResult) return <CareerWeekendRecovery fighter={fighterId} result={weekendResult} onComplete={() => finishCareerWeek(weekendResult)} />

  if (fighting && setup) return <FightronGame setup={setup} careerEvent={event} careerUpgrades={upgrades} careerModifiers={conditionMultipliers(condition)} isTitleFight={titleFight} titleDefense={championId === fighterId} onExit={() => setFighting(false)} onCareerComplete={fight => { setFighting(false); setWeekendResult(fight) }} />

  if (showNews) return <main className="career-screen career-news-page"><header><button onClick={() => setShowNews(false)}>← CAREER HUB</button><div><small>FCB MEDIA CENTER</small><h1>FCB NEWS</h1></div><b>EVENT {event}</b></header><CareerNews results={results} standings={standings} championId={championId} fighterId={fighterId} opponentId={opponent} restingId={resting} event={event} contractMessage={contractMessage} /></main>
  return <CareerHeadquarters fighterId={fighterId} championId={championId} opponent={opponent} event={event} cash={cash} purse={purse} contractMessage={contractMessage} fanHype={fanHype} condition={condition} standings={standings} choices={choices} upgrades={upgrades} upgradeInfo={upgradeInfo} onExit={onExit} onNews={() => setShowNews(true)} onRequest={request} onBuy={buy} onFight={() => setFightWeek(true)} onRest={restEvent} />
}
