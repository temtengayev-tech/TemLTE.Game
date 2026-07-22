import { useState } from 'react'
import type { FighterId } from '../game/fighters'
import { CareerMediaDay } from './CareerMediaDay'
import { CareerSparring } from './CareerSparring'
import { CareerTraining } from './CareerTraining'
import { CareerWeighIn } from './CareerWeighIn'

const days = ['TRAINING', 'SPARRING', 'MEDIA', 'WEIGH-IN', 'FIGHT', 'REST', 'REST']

export function CareerFightWeek({ fighter, opponent, event, onCancel, onReady, onHype }: { fighter: FighterId; opponent: FighterId; event: number; onCancel: () => void; onReady: () => void; onHype: (amount: number) => void }) {
  const [day, setDay] = useState(0); const next = () => setDay(value => Math.min(4, value + 1))
  return <main className="career-fight-week"><header><button onClick={onCancel}>← CAREER HQ</button><div><small>FCB OFFICIAL EVENT</small><h1>FIGHT WEEK</h1></div><b>DAY {day + 1} / 7</b></header><nav>{days.map((label, index) => <span key={`${label}-${index}`} className={index === day ? 'active' : index < day ? 'complete' : index > 4 ? 'rest' : ''}><i>{index < day ? '✓' : index + 1}</i>{label}</span>)}</nav>{day === 0 ? <CareerTraining fighter={fighter} onComplete={next} /> : day === 1 ? <CareerSparring fighter={fighter} opponent={opponent} onComplete={next} /> : day === 2 ? <CareerMediaDay fighter={fighter} opponent={opponent} event={event} onComplete={hype => { onHype(hype); next() }} /> : day === 3 ? <CareerWeighIn fighter={fighter} opponent={opponent} onComplete={next} /> : <section className="fight-night-ready"><small>FRIDAY · MAIN EVENT</small><h1>FIGHT NIGHT</h1><p>Training complete. Medicals cleared. Weight certified.</p><button onClick={onReady}>WALK TO THE OCTAGON →</button></section>}</main>
}
