import { useMemo, useState } from 'react'
import { fighters, type FighterId, type GameSetup } from '../game/fighters'
import { FightronGame } from './FightronGame'
import { CareerNews } from './CareerNews'

const roster = Object.keys(fighters) as FighterId[]
const startingPoints: Record<FighterId, number> = { john: 80, khabibi: 62, islam: 54, chalres: 47, conor: 40, agent: 32, officer: 25 }
export type CareerResult = { id: string; event: number; winner: FighterId; loser: FighterId; detail: string; points: number; purse: number; playerFight: boolean; upset: boolean; titleChange: boolean }

function simulateEvent(event: number, excluded: FighterId[], championId: FighterId): CareerResult[] {
  const available = roster.filter(id => !excluded.includes(id)); const results: CareerResult[] = []
  const pairs = available.map((id, index) => [id, available[(index + 1) % available.length]] as const).filter((_, index) => index % 2 === 0 || index === available.length - 1)
  pairs.forEach(([first, second], index) => {
    const favorite = startingPoints[first] >= startingPoints[second] ? first : second; const underdog = favorite === first ? second : first
    const upset = (event * 29 + index * 19 + fighters[underdog].speed) % 100 < 24
    const winner = upset ? underdog : favorite; const knockout = (event + index) % 2 === 0; const points = knockout ? 13 : 10
    const purse = 5000 + Math.max(startingPoints[first], startingPoints[second]) * 120 + event * 500
    const loser = winner === first ? second : first; const titleChange = (first === championId || second === championId) && loser === championId
    results.push({ id: `${event}-${first}-${second}`, event, winner, loser, detail: knockout ? `KO · ROUND ${1 + (event + index) % 3}` : 'DECISION · 2–1', points, purse, playerFight: false, upset, titleChange })
  })
  return results
}

export function CareerMode({ fighterId, onExit }: { fighterId: FighterId; onExit: () => void }) {
  const [event, setEvent] = useState(1); const [fighting, setFighting] = useState(false)
  const [opponent, setOpponent] = useState<FighterId | null>(null); const [lastLoss, setLastLoss] = useState<FighterId | null>(null)
  const [results, setResults] = useState<CareerResult[]>([]); const [championId, setChampionId] = useState<FighterId>('john')
  const developmentLevel = Math.min(10, Math.max(0, event - 1))
  const [contractMessage, setContractMessage] = useState('Send a fight request to any available fighter.')
  const standings = useMemo(() => {
    const scores = new Map<FighterId, number>(roster.map(id => [id, startingPoints[id]]))
    results.forEach(result => scores.set(result.winner, (scores.get(result.winner) ?? 0) + result.points))
    return [...scores.entries()].sort((a, b) => b[1] - a[1])
  }, [results])
  const playerRank = standings.findIndex(([id]) => id === fighterId)
  const choices = standings.map(([id]) => id).filter(id => id !== fighterId && (id !== championId || playerRank < 3 || championId === fighterId))
  const opponentRank = opponent ? standings.findIndex(([id]) => id === opponent) : -1
  const rankReward = opponent ? Math.max(4, Math.min(22, 10 + (playerRank - opponentRank) * 3)) : 0
  const contractPurse = opponent ? 5000 + (standings.length - opponentRank) * 2500 + event * 500 : 0
  const careerEarnings = results.filter(result => result.playerFight).reduce((total, result) => total + result.purse, 0)
  const titleFight = Boolean(opponent) && (opponent === championId || championId === fighterId)
  const titleDefense = championId === fighterId; const setup: GameSetup | null = opponent ? { mode: 'career', player: fighterId, opponent } : null
  const requestFight = (id: FighterId) => {
    const targetRank = standings.findIndex(([ranked]) => ranked === id); const difference = targetRank - playerRank
    const acceptanceChance = difference >= 0 ? 82 : Math.max(38, 68 + difference * 8)
    const accepted = (event * 37 + fighters[id].speed * 7 + targetRank * 11) % 100 < acceptanceChance
    if (!accepted) { setOpponent(null); setContractMessage(`${fighters[id].name} declined the offer. Request another fighter or try again next event.`); return }
    setOpponent(id); setContractMessage(`${fighters[id].name} accepted. The contract is ready to sign.`)
  }

  if (fighting && setup) return <FightronGame setup={setup} careerEvent={event} isTitleFight={titleFight} titleDefense={titleDefense} onExit={() => setFighting(false)} onCareerComplete={fight => {
    const points = (fight.won ? rankReward : 10) + (fight.method === 'knockout' ? 3 : 0); const loser = fight.won ? setup.opponent : fighterId
    const detail = fight.method === 'knockout' ? `KO · ROUND ${fight.finishRound}` : `${Math.max(fight.playerRounds, fight.opponentRounds)}–${Math.min(fight.playerRounds, fight.opponentRounds)} DECISION`
    const upset = fight.won && opponentRank < playerRank; const playerTitleChange = titleFight && fight.winner !== championId
    const cardResults = simulateEvent(event, [fighterId, setup.opponent], championId)
    const cardTitleChange = cardResults.find(result => result.titleChange)
    setResults(current => [...current, { id: `${event}-player`, event, winner: fight.winner, loser, detail, points, purse: contractPurse, playerFight: true, upset, titleChange: playerTitleChange }, ...cardResults])
    setLastLoss(fight.won ? null : setup.opponent)
    if (titleFight) setChampionId(fight.winner); else if (cardTitleChange) setChampionId(cardTitleChange.winner)
    setEvent(value => value + 1); setOpponent(null); setFighting(false)
  }} />

  return <main className="career-screen">
    <header><button onClick={onExit}>← MODES</button><div><small>LIVE FCB SEASON · EVENT {event}</small><h1>CAREER MODE</h1></div><b>{standings[playerRank]?.[1]} PTS · ${careerEarnings.toLocaleString()}</b></header>
    <section className="career-hero"><div><small>YOUR FIGHTER</small><i className={`frame-sprite ${fighters[fighterId].sheet} action-idle`} /><h2>{fighters[fighterId].name}</h2><p>{championId === fighterId ? 'FCB WORLD CHAMPION' : `RANK #${playerRank + 1}`}</p></div><article><small>{titleFight ? titleDefense ? 'FCB TITLE DEFENSE' : 'FCB TITLE FIGHT' : 'FIGHT CONTRACTS'}</small><h2>{opponent ? `VS ${fighters[opponent].name}` : 'OPEN CONTRACTS'}</h2><p>{contractMessage}</p><div className="career-opponents">{choices.map(id => { const rank = standings.findIndex(([ranked]) => ranked === id); const reward = Math.max(4, Math.min(22, 10 + (playerRank - rank) * 3)); const purse = 5000 + (standings.length - rank) * 2500 + event * 500; return <button key={id} className={opponent === id ? 'selected' : ''} onClick={() => requestFight(id)}><span>#{rank + 1}</span><b>{fighters[id].name}</b><small>{id === championId ? 'TITLE REQUEST · ' : id === lastLoss ? 'REMATCH · ' : ''}+{reward} PTS · ${purse.toLocaleString()}</small></button> })}</div><button disabled={!opponent} onClick={() => setFighting(true)}>{titleFight ? titleDefense ? 'DEFEND THE WORLD TITLE' : 'FIGHT FOR THE BELT' : `SIGN CONTRACT · +${rankReward} PTS`} · ${contractPurse.toLocaleString()} →</button></article></section>
    <section className="career-standings"><h3>LIVE FCB STANDINGS</h3>{standings.map(([id, score], index) => <div key={id} className={id === fighterId ? 'player-standing' : ''}><b>#{index + 1}</b><span>{fighters[id].name}{id === championId && <small> · FCB CHAMPION</small>}</span><strong>{score} PTS</strong></div>)}</section>
    <section className="career-development"><header><small>EVENT {event} DEVELOPMENT · CAPPED AT LEVEL 10</small><h3>FIGHTER EVOLUTION</h3></header><div><span><b>+{developmentLevel * 10}</b> HEALTH</span><span><b>+{developmentLevel * 6}</b> STAMINA</span><span><b>+{developmentLevel * 2}</b> ALL DAMAGE</span></div><p>Islam and Khabibi gain +10 slide damage. Conor and Charles gain stronger roundhouses with a balanced +0.5 second stun. The Agent gains +6 punch damage.</p></section>
    <CareerNews results={results} championId={championId} fighterId={fighterId} opponentId={opponent} event={event} contractMessage={contractMessage} />
    <section className="career-results"><header><small>EVERY EVENT · EVERY FIGHTER</small><h3>PUBLISHED RESULTS</h3></header>{results.length === 0 ? <p>No results yet. Choose your first opponent.</p> : [...results].reverse().map(result => <article key={result.id} className={result.playerFight ? 'player-result' : ''}><span>EVENT {result.event}</span><b>{fighters[result.winner].name}</b><em>def. {fighters[result.loser].name}</em><strong>{result.detail} · +{result.points} PTS · ${result.purse.toLocaleString()}</strong></article>)}</section>
  </main>
}
