import { useMemo, useState } from 'react'
import { combatProfiles, fighters, type FighterId, type GameSetup } from '../game/fighters'
import { CareerNews } from './CareerNews'
import { FightronGame, type CareerUpgrades } from './FightronGame'

const roster = Object.keys(fighters) as FighterId[]
const startingPoints: Record<FighterId, number> = { john: 80, khabibi: 62, islam: 54, chalres: 47, conor: 40, agent: 32, officer: 25 }
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

export function CareerMode({ fighterId, onExit }: { fighterId: FighterId; onExit: () => void }) {
  const [event, setEvent] = useState(1); const [fighting, setFighting] = useState(false); const [showNews, setShowNews] = useState(false)
  const [opponent, setOpponent] = useState<FighterId | null>(null); const [results, setResults] = useState<CareerResult[]>([])
  const [championId, setChampionId] = useState<FighterId>('john'); const [resting, setResting] = useState<FighterId | null>(null)
  const [contractMessage, setContractMessage] = useState('Send a fight request, visit FCB News, train, or rest this event.')
  const [upgrades, setUpgrades] = useState<CareerUpgrades>({ health: 0, stamina: 0, damage: 0, slide: 0, roundhouse: 0 }); const [spent, setSpent] = useState(0)
  const standings = useMemo(() => { const scores = new Map<FighterId, number>(roster.map(id => [id, startingPoints[id]])); results.forEach(result => scores.set(result.winner, (scores.get(result.winner) ?? 0) + result.points)); return [...scores.entries()].sort((a, b) => b[1] - a[1]) }, [results])
  const earnings = results.filter(result => result.playerFight).reduce((sum, result) => sum + result.purse, 0); const cash = earnings - spent
  const playerRank = standings.findIndex(([id]) => id === fighterId); const choices = standings.map(([id]) => id).filter(id => id !== fighterId && (id !== championId || playerRank < 3 || championId === fighterId))
  const opponentRank = opponent ? standings.findIndex(([id]) => id === opponent) : -1; const rankReward = opponent ? Math.max(4, Math.min(22, 10 + (playerRank - opponentRank) * 3)) : 0
  const purse = opponent ? 5000 + (standings.length - opponentRank) * 2500 + event * 500 : 0; const titleFight = Boolean(opponent) && (opponent === championId || championId === fighterId)
  const setup: GameSetup | null = opponent ? { mode: 'career', player: fighterId, opponent } : null
  const applyCard = (card: ReturnType<typeof simulateEvent>) => { const change = card.results.find(result => result.titleChange); setResults(current => [...current, ...card.results]); setResting(card.resting); if (change) setChampionId(change.winner) }
  const restEvent = () => { applyCard(simulateEvent(event, [fighterId], championId)); setContractMessage(`You rested at Event ${event}. The other six fighters completed the card.`); setOpponent(null); setEvent(value => value + 1) }
  const buy = (key: UpgradeKey) => { const item = upgradeInfo[key]; const cost = item.cost * (upgrades[key] + 1); if (cash < cost || upgrades[key] >= 5) return; setSpent(value => value + cost); setUpgrades(current => ({ ...current, [key]: current[key] + 1 })) }
  const request = (id: FighterId) => { const rank = standings.findIndex(([ranked]) => ranked === id); const chance = rank >= playerRank ? 82 : Math.max(38, 68 + (rank - playerRank) * 8); const accepted = (event * 37 + fighters[id].speed * 7 + rank * 11) % 100 < chance; setOpponent(accepted ? id : null); setContractMessage(accepted ? `${fighters[id].name} accepted the contract.` : `${fighters[id].name} declined. Choose another opponent or rest.`) }

  if (fighting && setup) return <FightronGame setup={setup} careerEvent={event} careerUpgrades={upgrades} isTitleFight={titleFight} titleDefense={championId === fighterId} onExit={() => setFighting(false)} onCareerComplete={fight => {
    const points = (fight.won ? rankReward : 10) + (fight.method === 'knockout' ? 3 : 0); const loser = fight.won ? setup.opponent : fighterId
    const detail = fight.method === 'knockout' ? `KO · ROUND ${fight.finishRound}` : `${Math.max(fight.playerRounds, fight.opponentRounds)}–${Math.min(fight.playerRounds, fight.opponentRounds)} DECISION`
    const card = simulateEvent(event, [fighterId, setup.opponent], championId); const titleChange = titleFight && fight.winner !== championId
    setResults(current => [...current, { id: `${event}-player`, event, winner: fight.winner, loser, detail, points, purse, playerFight: true, upset: fight.won && opponentRank < playerRank, titleChange }, ...card.results]); setResting(card.resting)
    if (titleFight) setChampionId(fight.winner); else { const change = card.results.find(result => result.titleChange); if (change) setChampionId(change.winner) }
    setEvent(value => value + 1); setOpponent(null); setFighting(false)
  }} />

  if (showNews) return <main className="career-screen career-news-page"><header><button onClick={() => setShowNews(false)}>← CAREER HUB</button><div><small>FCB MEDIA CENTER</small><h1>FCB NEWS</h1></div><b>EVENT {event}</b></header><CareerNews results={results} standings={standings} championId={championId} fighterId={fighterId} opponentId={opponent} restingId={resting} event={event} contractMessage={contractMessage} /></main>
  return <main className="career-screen"><header><button onClick={onExit}>← MODES</button><div><small>LIVE FCB SEASON · EVENT {event}</small><h1>CAREER MODE</h1></div><aside><button onClick={() => setShowNews(true)}>FCB NEWS →</button><b>{standings[playerRank]?.[1]} PTS · ${cash.toLocaleString()}</b></aside></header>
    <section className="career-hero"><div><small>YOUR FIGHTER</small><i className={`frame-sprite ${fighters[fighterId].sheet} action-idle`} /><h2>{fighters[fighterId].name}</h2><p>{championId === fighterId ? 'FCB WORLD CHAMPION' : `RANK #${playerRank + 1}`}</p></div><article><small>{titleFight ? championId === fighterId ? 'TITLE DEFENSE' : 'TITLE FIGHT' : 'FIGHT CONTRACTS'}</small><h2>{opponent ? `VS ${fighters[opponent].name}` : 'OPEN CONTRACTS'}</h2><p>{contractMessage}</p><div className="career-opponents">{choices.map(id => { const rank = standings.findIndex(([ranked]) => ranked === id); return <button key={id} className={opponent === id ? 'selected' : ''} onClick={() => request(id)}><span>#{rank + 1}</span><b>{fighters[id].name}</b><small>+{Math.max(4, Math.min(22, 10 + (playerRank - rank) * 3))} PTS</small></button> })}</div><div className="career-contract-actions"><button disabled={!opponent} onClick={() => setFighting(true)}>SIGN · ${purse.toLocaleString()}</button><button onClick={restEvent}>REST THIS EVENT</button></div></article></section>
    <section className="career-shop"><header><small>TRAINING CAMP</small><h3>BUY UPGRADES</h3><b>${cash.toLocaleString()} AVAILABLE</b></header><div>{(Object.keys(upgradeInfo) as UpgradeKey[]).map(key => { const item = upgradeInfo[key]; const cost = item.cost * (upgrades[key] + 1); return <button key={key} disabled={cash < cost || upgrades[key] >= 5} onClick={() => buy(key)}><span>{item.label} · LV {upgrades[key]}/5</span><b>{item.gain}</b><strong>{upgrades[key] >= 5 ? 'MAXED' : `$${cost.toLocaleString()}`}</strong></button> })}</div></section>
    <section className="career-fighter-trait"><small>PERSONAL DEVELOPMENT PROFILE</small><h3>{fighters[fighterId].name}</h3><p>{combatProfiles[fighterId].careerTrait}</p><div><span>PUNCH <b>{Math.round(combatProfiles[fighterId].punch * 100)}%</b></span><span>KICK <b>{Math.round(combatProfiles[fighterId].kick * 100)}%</b></span><span>SLIDE <b>{Math.round(combatProfiles[fighterId].slide * 100)}%</b></span><span>ROUNDHOUSE <b>{Math.round(combatProfiles[fighterId].roundhouse * 100)}%</b></span><span>ATTACK SPEED <b>{Math.round(combatProfiles[fighterId].attackSpeed * 100)}%</b></span></div></section>
    <section className="career-standings"><h3>LIVE FCB STANDINGS</h3>{standings.map(([id, score], index) => <div key={id} className={id === fighterId ? 'player-standing' : ''}><b>#{index + 1}</b><span>{fighters[id].name}{id === championId && <small> · FCB CHAMPION</small>}{id === resting && <small> · RESTED LAST EVENT</small>}</span><strong>{score} PTS</strong></div>)}</section>
    <section className="career-results"><header><small>ROTATING EVENT CARDS</small><h3>PUBLISHED RESULTS</h3></header>{results.length === 0 ? <p>No results yet.</p> : [...results].reverse().map(result => <article key={result.id} className={result.playerFight ? 'player-result' : ''}><span>EVENT {result.event}</span><b>{fighters[result.winner].name}</b><em>def. {fighters[result.loser].name}</em><strong>{result.detail} · +{result.points} PTS</strong></article>)}</section>
  </main>
}
