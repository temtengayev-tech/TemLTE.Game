import { useState, type CSSProperties } from 'react'
import { fighters, versionOneFighterIds, type FighterId } from '../game/fighters'
import { playFightSound } from '../lib/fightSounds'
import { getVersionOneStrip } from '../game/versionOneStrips'

const actions = [
  ['idle', 'IDLE'], ['run', 'MOVEMENT'], ['jump', 'JUMP'], ['punch', 'PUNCH'],
  ['kick', 'KICK'], ['roundhouse', 'ROUNDHOUSE'], ['slide', 'SLIDE'],
  ['stagger', 'STUN'], ['knockdown', 'FALL'], ['recovery', 'RECOVERY'],
] as const

type TestAction = typeof actions[number][0]

export function AnimationTestMode({ initialFighter, onExit }: { initialFighter: FighterId; onExit: () => void }) {
  const [fighterId, setFighterId] = useState(initialFighter)
  const [action, setAction] = useState<TestAction>('idle')
  const [mirrored, setMirrored] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [frame, setFrame] = useState(0)
  const [replay, setReplay] = useState(0)
  const fighter = fighters[fighterId]
  const strip = getVersionOneStrip(fighterId, action)
  const frameCount = strip?.frames ?? 8
  const stripStyle = strip ? {
    backgroundImage: `url('${strip.url}')`,
    '--strip-frames': frameCount,
    '--strip-steps': frameCount - 1,
    ...(playing ? {} : { animation: 'none', backgroundPositionX: `${frame / (frameCount - 1) * 100}%` }),
  } as CSSProperties : {
    backgroundImage: `url('/assets/combat-v1/${fighterId}.png')`,
    ...(playing ? {} : { animation: 'none', backgroundPositionX: `${frame / 7 * 100}%` }),
  }

  return <main className="fight-screen animation-test-mode">
    <header><button type="button" onClick={onExit}>← MODES</button><div><small>VERSION 1 QUALITY CONTROL</small><h1>ANIMATION TEST</h1></div><b>ONE FRAME AT A TIME · {mirrored ? 'FACING LEFT' : 'FACING RIGHT'}</b></header>
    <section className="test-stage">
      <div className={mirrored ? 'test-fighter mirrored' : 'test-fighter'}>
        <i key={`${fighterId}-${action}-${replay}`} className={`frame-sprite combat-v1-frames action-${action} ${strip ? 'version-one-strip' : ''}`} style={stripStyle} />
      </div>
      <h2>{fighter.name}</h2><p>{fighter.nickname} · {action.toUpperCase()}</p>
    </section>
    <aside className="test-panel">
      <label>VERSION 1 FIGHTER<select value={fighterId} onChange={event => setFighterId(event.target.value as FighterId)}>{versionOneFighterIds.map(id => <option key={id} value={id}>{fighters[id].name}</option>)}</select></label>
      <div className="test-actions">{actions.map(([id, label]) => <button type="button" className={action === id ? 'active' : ''} key={id} onClick={() => { if (id === 'punch' || id === 'kick' || id === 'slide' || id === 'roundhouse' || id === 'knockdown') playFightSound(id); setAction(id); setReplay(value => value + 1) }}>{label}</button>)}</div>
      <div className="test-tools"><button type="button" onClick={() => setMirrored(value => !value)}>FLIP DIRECTION</button><button type="button" onClick={() => { setPlaying(true); setReplay(value => value + 1) }}>REPLAY</button><button type="button" onClick={() => setPlaying(value => !value)}>{playing ? 'PAUSE' : 'PLAY'}</button></div>
      {!playing && <label>FRAME {Math.min(frame, frameCount - 1) + 1}<input type="range" min="0" max={frameCount - 1} value={Math.min(frame, frameCount - 1)} onChange={event => setFrame(Number(event.target.value))} /></label>}
    </aside>
  </main>
}
