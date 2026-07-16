import { useCallback, useEffect, useRef, useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import { FullscreenButton } from './FullscreenButton'
import { MobileFightControls } from './MobileFightControls'

type SoloAction = 'idle' | 'run' | 'jump' | 'punch' | 'kick' | 'slide' | 'roundhouse'

export function SoloRing({ fighterId, onExit }: { fighterId: FighterId; onExit: () => void }) {
  const fighter = fighters[fighterId]
  const [x, setX] = useState(50)
  const [action, setAction] = useState<SoloAction>('idle')
  const keys = useRef(new Set<string>())
  const actionTimer = useRef<number>()

  const perform = useCallback((next: SoloAction, duration = 500) => {
    window.clearTimeout(actionTimer.current)
    setAction(next)
    actionTimer.current = window.setTimeout(() => setAction('idle'), duration)
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(event.code)) event.preventDefault()
      keys.current.add(event.code)
      if (event.repeat) return
      if (event.code === 'Space' || event.code === 'KeyW') perform('jump', 700)
      if (event.code === 'KeyF') perform('punch', 420)
      if (event.code === 'KeyE') perform('kick', 390)
      if (event.code === 'KeyR') perform('slide', 650)
      if (event.code === 'KeyT') perform('roundhouse', 820)
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    const movement = window.setInterval(() => {
      const direction = Number(keys.current.has('ArrowRight') || keys.current.has('KeyD')) - Number(keys.current.has('ArrowLeft') || keys.current.has('KeyA'))
      if (direction) { setX(current => Math.max(8, Math.min(92, current + direction * 1.2))); setAction(current => current === 'idle' || current === 'run' ? 'run' : current) }
      else setAction(current => current === 'run' ? 'idle' : current)
    }, 24)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.clearInterval(movement); window.clearTimeout(actionTimer.current); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [perform])

  return <main className="solo-ring">
    <header><button onClick={onExit}>← MODES</button><h1>FIGHTRON</h1><div><span>SOLO / OPEN RING</span><FullscreenButton /></div></header>
    <section className="solo-arena">
      <div className="solo-lights"><i /><i /><i /><i /></div><div className="solo-cage" /><div className="solo-floor"><b>FIGHTRON</b></div>
      <div className={`solo-fighter ${action === 'jump' ? 'solo-jump' : ''}`} style={{ left: `${x}%` }}><i className={`frame-sprite ${fighter.sheet} action-${action}`} /></div>
      <aside><small>OPEN TRAINING</small><strong>{fighter.name}</strong><p>No clock. No opponent. Own the ring.</p></aside>
    </section>
    <footer><span>A / D MOVE</span><span>W JUMP</span><span>E KICK</span><span>F PUNCH</span><span>R SLIDE</span><span>T ROUNDHOUSE</span></footer>
    <MobileFightControls specialLabel="KICK" onMoveStart={direction => {
      keys.current.delete(direction === 'left' ? 'ArrowRight' : 'ArrowLeft')
      keys.current.add(direction === 'left' ? 'ArrowLeft' : 'ArrowRight')
    }} onMoveEnd={() => { keys.current.delete('ArrowLeft'); keys.current.delete('ArrowRight') }} onJump={() => perform('jump', 700)} onAttack={next => {
      if (next === 'special') perform('kick', 390)
      else if (next === 'punch') perform('punch', 420)
      else if (next === 'slide') perform('slide', 650)
      else perform('roundhouse', 820)
    }} />
  </main>
}
