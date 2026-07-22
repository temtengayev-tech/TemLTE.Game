import { useState } from 'react'
import type { FighterId } from '../game/fighters'
import type { VersionOneAction } from '../game/versionOneStrips'
import { VersionOneActor } from './VersionOneActor'

const drills: Array<{ action: VersionOneAction; label: string; target: number }> = [
  { action: 'punch', label: 'FOCUS MITTS', target: 5 },
  { action: 'kick', label: 'BODY KICKS', target: 4 },
  { action: 'slide', label: 'TAKEDOWN ENTRY', target: 3 },
  { action: 'roundhouse', label: 'POWER FINISH', target: 2 },
]

export function CareerTraining({ fighter, onComplete }: { fighter: FighterId; onComplete: () => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [action, setAction] = useState<VersionOneAction>('idle')
  const complete = drills.every(drill => (counts[drill.action] ?? 0) >= drill.target)
  const perform = (drill: typeof drills[number]) => {
    setAction(drill.action)
    setCounts(current => ({ ...current, [drill.action]: drill.target }))
    window.setTimeout(() => setAction('idle'), 700)
  }
  return <section className="fight-week-screen training-day"><header><small>MONDAY · TRAINING CAMP</small><h1>CHOOSE EACH TRAINING STATION</h1><p>Tap each red START button once. Complete all four stations to continue.</p></header><div className="fight-week-stage"><VersionOneActor fighter={fighter} action={action} loop={action === 'idle'} /><div className="training-drills">{drills.map(drill => { const count = counts[drill.action] ?? 0; const done = count >= drill.target; return <button type="button" key={drill.action} className={done ? 'complete' : ''} disabled={done} onClick={() => perform(drill)}><span>{drill.label}</span><strong>{done ? '✓ COMPLETED' : 'START →'}</strong><b>{done ? `${drill.target} REPS DONE` : `${drill.target} REPS`}</b><i><em style={{ width: `${count / drill.target * 100}%` }} /></i></button> })}</div></div><footer><b>{complete ? 'ALL STATIONS COMPLETE · +5% CONDITION' : 'FINISH ALL 4 RED START BUTTONS'}</b><button type="button" disabled={!complete} onClick={onComplete}>FINISH TRAINING →</button></footer></section>
}
