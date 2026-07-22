import { useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import type { CareerFightResult } from './FightronGame'
import { VersionOneActor } from './VersionOneActor'

const week = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function CareerWeekendRecovery({ fighter, result, onComplete }: { fighter: FighterId; result: CareerFightResult; onComplete: () => void }) {
  const [day, setDay] = useState(5)
  const sunday = day === 6
  return <main className="career-fight-week weekend-recovery">
    <header><span /><div><small>FCB CAREER CALENDAR</small><h1>FIGHT WEEK</h1></div><b>DAY {day + 1} / 7</b></header>
    <nav>{week.map((label, index) => <span key={label} className={index === day ? 'active rest' : index < day ? 'complete' : 'rest'}><i>{index < day ? '✓' : index + 1}</i>{label}</span>)}</nav>
    <section className="weekend-card">
      <div><small>{sunday ? 'SUNDAY · FULL REST' : 'SATURDAY · MEDICAL RECOVERY'}</small><h1>{sunday ? 'RESET FOR NEXT WEEK' : 'RECOVER AFTER THE FIGHT'}</h1><p>{sunday ? 'No training today. Your fighter rests, reviews the result, and prepares for the next event.' : 'The fight is over. Medical staff check your fighter while fatigue begins to recover.'}</p></div>
      <VersionOneActor fighter={fighter} action="recovery" loop />
      <aside><small>FIGHT RESULT</small><h2>{result.won ? 'VICTORY' : 'DEFEAT'}</h2><b>{fighters[result.winner].name}</b><p>{result.method === 'knockout' ? `KO · ROUND ${result.finishRound}` : 'JUDGES’ DECISION'}</p><span>FATIGUE <strong>{sunday ? 'LOW' : 'RECOVERING'}</strong></span><span>MEDICAL <strong>CLEARED</strong></span></aside>
      <button onClick={() => sunday ? onComplete() : setDay(6)}>{sunday ? 'FINISH WEEK →' : 'CONTINUE TO SUNDAY →'}</button>
    </section>
  </main>
}
