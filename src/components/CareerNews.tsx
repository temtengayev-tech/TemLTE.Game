import { useCallback, useEffect, useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import { generateCareerNews, type AiCareerNews } from '../lib/careerNewsAi'
import type { CareerResult } from './CareerMode'

const roster = Object.keys(fighters) as FighterId[]

const rumors = [
  'A contender was reportedly seen testing a new spinning attack behind closed doors.',
  'An anonymous cornerman claims a major rematch is already being negotiated.',
  'FCB insiders say one ranked fighter may change camps before the next event.',
  'Training footage has sparked rumors that a surprise grappling specialist is joining a striking camp.',
]

export function CareerNews({ results, standings, championId, fighterId, opponentId, restingId, event, contractMessage }: { results: CareerResult[]; standings: Array<[FighterId, number]>; championId: FighterId; fighterId: FighterId; opponentId: FighterId | null; restingId: FighterId | null; event: number; contractMessage: string }) {
  const [votes, setVotes] = useState<[number, number]>([58, 42])
  const [voted, setVoted] = useState(false)
  const [aiNews, setAiNews] = useState<AiCareerNews | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const refreshAiNews = useCallback(async () => {
    setAiStatus('loading')
    try { setAiNews(await generateCareerNews({ results, standings, championId, fighterId, opponentId, event })); setAiStatus('idle') }
    catch { setAiStatus('error') }
  }, [championId, event, fighterId, opponentId, results, standings])
  useEffect(() => { const first = 44 + (event * 7 + (opponentId ? fighters[opponentId].speed : 0)) % 25; setVotes([first, 100 - first]); setVoted(false) }, [event, opponentId])
  useEffect(() => { void refreshAiNews() }, [event, results.length])
  const latest = results.length ? results[results.length - 1] : undefined
  const upset = [...results].reverse().find(result => result.upset)
  const knockout = [...results].reverse().find(result => result.detail.startsWith('KO'))
  const titleChange = [...results].reverse().find(result => result.titleChange)
  const otherFighters = roster.filter(id => id !== fighterId && id !== opponentId)
  const upcoming = otherFighters.reduce<Array<[FighterId, FighterId]>>((cards, id, index) => index % 2 === 0 && otherFighters[index + 1] ? [...cards, [id, otherFighters[index + 1]]] : cards, [])
  const prediction = (first: FighterId, second: FighterId) => {
    const firstPoints = standings.find(([id]) => id === first)?.[1] ?? 0; const secondPoints = standings.find(([id]) => id === second)?.[1] ?? 0
    const firstPower = fighters[first].maxHealth + fighters[first].speed * 7 + firstPoints * 3 + (event * 13 + fighters[first].speed) % 22
    const secondPower = fighters[second].maxHealth + fighters[second].speed * 7 + secondPoints * 3 + (event * 9 + fighters[second].speed) % 22
    const firstPercent = Math.max(24, Math.min(76, Math.round(firstPower / (firstPower + secondPower) * 100)))
    return [firstPercent, 100 - firstPercent] as const
  }
  return <section className="career-news">
    <header><div><small>FCB NEWS NETWORK · GEMINI LIVE DESK</small><h3>THE FIGHT WIRE</h3></div><button className="ai-news-refresh" disabled={aiStatus === 'loading'} onClick={() => void refreshAiNews()}>{aiStatus === 'loading' ? 'WRITING…' : 'REFRESH AI NEWS'}</button><b>LIVE · EVENT {event}</b></header>
    <div className="news-grid">
      {aiNews?.stories.map((story, index) => <article key={`${story.headline}-${index}`} className={index === 0 ? 'lead-story ai-story' : 'ai-story'}><span>{story.category} · AI DESK</span><h4>{story.headline}</h4><p>{story.body}</p></article>)}
      {aiNews?.poll && <article className="ai-prediction"><span>GEMINI PUBLIC PREDICTION</span><h4>{fighters[aiNews.poll.first].name} VS {fighters[aiNews.poll.second].name}</h4><div><i style={{ width: `${aiNews.poll.firstPercent}%` }} /><b>{fighters[aiNews.poll.first].name} {aiNews.poll.firstPercent}%</b><b>{100 - aiNews.poll.firstPercent}% {fighters[aiNews.poll.second].name}</b></div><p>Prediction uses the current FCB rankings, points and recent results.</p></article>}
      {aiStatus === 'error' && <article className="ai-news-error"><span>AI DESK OFFLINE</span><h4>USING LOCAL FCB COVERAGE</h4><p>Gemini news could not load. Confirm the server-side GEMINI_API_KEY and deploy the existing ai function. Career results and local news remain available.</p></article>}
      <article className="lead-story"><span>{titleChange ? 'BREAKING · NEW CHAMPION' : 'CHAMPIONSHIP'}</span><h4>{titleChange ? `${fighters[titleChange.winner].name} DEFEATS ${fighters[titleChange.loser].name} AND CLAIMS THE FCB BELT` : `${fighters[championId].name} HOLDS THE FCB WORLD TITLE`}</h4><p>{titleChange ? `${titleChange.detail} at Event ${titleChange.event}. The former champion has lost the belt and ${fighters[titleChange.winner].name} is the new FCB World Champion.` : 'The championship follows its winner. Any fighter who defeats the belt holder in an official title fight becomes the new champion.'}</p></article>
      {upset ? <article><span>UPSET ALERT</span><h4>{fighters[upset.winner].name} SHOCKS {fighters[upset.loser].name}</h4><p>A ranked underdog changed the standings at Event {upset.event} with a {upset.detail.toLowerCase()} victory.</p></article> : <article><span>RANKINGS</span><h4>CONTENDERS HUNT FOR POSITION</h4><p>No major upset yet, but higher purses and title eligibility are pushing fighters toward riskier contracts.</p></article>}
      {knockout && <article><span>FINISH OF THE WEEK</span><h4>{fighters[knockout.winner].name} DELIVERS THE EVENT’S BIG FINISH</h4><p>{knockout.detail}. The winner collected ${knockout.purse.toLocaleString()} and {knockout.points} ranking points.</p></article>}
      <article><span>CONTRACT DESK</span><h4>{latest ? `${fighters[latest.winner].name} LEAVES EVENT ${latest.event} WITH MOMENTUM` : 'NEW SEASON CONTRACTS OPEN'}</h4><p>{contractMessage}</p></article>
      <article><span>TRAINING WATCH</span><h4>THE ROSTER IS GETTING STRONGER</h4><p>Event {event} fighters enter camp with improved health, stamina and damage. Specialist techniques continue to evolve.</p></article>
      <article><span>EVENT SCHEDULE</span><h4>{restingId ? `${fighters[restingId].name} RECEIVES THE REST SLOT` : 'REST SLOT TO BE ANNOUNCED'}</h4><p>With seven active fighters, one athlete rests each event while the other six compete across three rotating matchups.</p></article>
      <article className="rumor-story"><span>RUMOR MILL · UNCONFIRMED</span><h4>THE PUBLIC IS TALKING</h4><p>{rumors[event % rumors.length]} FCB News has not independently confirmed the report.</p></article>
      <article className="public-poll"><span>FCB PUBLIC POLL</span><h4>{opponentId ? `WHO WINS: ${fighters[fighterId].name} OR ${fighters[opponentId].name}?` : 'SELECT AN OPPONENT TO OPEN THE POLL'}</h4>{opponentId && <div><button disabled={voted} onClick={() => { setVotes(([first, second]) => [first + 1, second]); setVoted(true) }}><b>{fighters[fighterId].name}</b><i style={{ width: `${votes[0] / (votes[0] + votes[1]) * 100}%` }} /><strong>{Math.round(votes[0] / (votes[0] + votes[1]) * 100)}%</strong></button><button disabled={voted} onClick={() => { setVotes(([first, second]) => [first, second + 1]); setVoted(true) }}><b>{fighters[opponentId].name}</b><i style={{ width: `${votes[1] / (votes[0] + votes[1]) * 100}%` }} /><strong>{Math.round(votes[1] / (votes[0] + votes[1]) * 100)}%</strong></button></div>}</article>
      <article className="upcoming-polls"><span>UPCOMING FCB FIGHTS · PUBLIC PICKS</span><h4>EVENT {event} PREDICTIONS</h4><div>{upcoming.map(([first, second]) => { const [firstPercent, secondPercent] = prediction(first, second); return <section key={`${first}-${second}`}><header><b>{fighters[first].name}</b><em>VS</em><b>{fighters[second].name}</b></header><div><i style={{ width: `${firstPercent}%` }} /><span>{firstPercent}%</span><span>{secondPercent}%</span></div></section> })}</div></article>
    </div>
  </section>
}
