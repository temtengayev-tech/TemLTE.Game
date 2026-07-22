import { useEffect, useState } from 'react'
import type { FighterId } from '../game/fighters'
import { fighters } from '../game/fighters'
import { VersionOneActor } from './VersionOneActor'

export function CareerWeighIn({ fighter, opponent, onComplete }: { fighter: FighterId; opponent: FighterId; onComplete: () => void }) {
  const [phase, setPhase] = useState<'scale' | 'faceoff'>('scale')
  useEffect(() => { const timer = window.setTimeout(() => setPhase('faceoff'), 2200); return () => window.clearTimeout(timer) }, [])
  return <section className="fight-week-screen weigh-in-day"><header><small>THURSDAY · OFFICIAL WEIGH-IN</small><h1>{phase === 'scale' ? 'WEIGHT CERTIFIED' : 'FINAL FACE-OFF'}</h1><p>{phase === 'scale' ? 'The commission has cleared both fighters.' : 'No contact before fight night.'}</p></header>{phase === 'scale' ? <div className="scale-stage"><VersionOneActor fighter={fighter} action="idle" loop /><div className="official-scale"><small>OFFICIAL WEIGHT</small><strong>{fighters[fighter].weight}</strong><span>✓ ON TARGET</span></div></div> : <div className="weighin-faceoff"><div><VersionOneActor fighter={fighter} action="idle" loop /><b>{fighters[fighter].name}</b></div><strong>VS</strong><div><VersionOneActor fighter={opponent} action="idle" mirrored loop /><b>{fighters[opponent].name}</b></div></div>}<footer><b>FCB ATHLETIC COMMISSION</b><button disabled={phase !== 'faceoff'} onClick={onComplete}>CONFIRM FIGHT →</button></footer></section>
}
