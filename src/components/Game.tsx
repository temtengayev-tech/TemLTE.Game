import { useCallback, useEffect, useRef, useState } from 'react'
import { canWalk, chaseTarget, findTile, inConeSight, inSight, isHidden, isSeen, makeState, movePatrols, samePoint, step } from '../game/engine'
import { LEVELS } from '../game/levels'
import type { Direction } from '../game/types'
import { Controls } from './Controls'
import { GameBoard } from './GameBoard'
import { GameHud } from './GameHud'
import { MissionModal } from './MissionModal'
import { MissionSidebar } from './MissionSidebar'
import { EquipmentPanel } from './EquipmentPanel'

export function Game({ initialLevel, onQuit }: { initialLevel: number; onQuit: () => void }) {
  const [levelIndex, setLevelIndex] = useState(initialLevel)
  const [state, setState] = useState(() => makeState(LEVELS[initialLevel]))
  const level = LEVELS[levelIndex]
  const lastMove = useRef(0)

  const move = useCallback((direction: Direction, sprinting = false) => {
    setState(current => {
      if (current.status !== 'playing') return current
      const destination = step(current.player, direction)
      if (!canWalk(level, destination)) return { ...current, message: 'That way is blocked.' }
      const turn = current.turn + 1
      const gotEvidence = current.evidence.some(item => samePoint(item, destination))
      const gotCoin = current.coins.some(item => samePoint(item, destination))
      const gotWeapon = current.weapons.some(item => samePoint(item, destination))
      let next = {
        ...current, player: destination, turn, stamina: sprinting ? Math.max(0, current.stamina - 6) : current.stamina,
        guards: turn % 2 === 0 ? movePatrols(current.guards) : current.guards,
        dogs: turn % 3 === 0 ? movePatrols(current.dogs) : current.dogs,
        evidence: current.evidence.filter(item => !samePoint(item, destination)),
        coins: current.coins.filter(item => !samePoint(item, destination)),
        weapons: current.weapons.filter(item => !samePoint(item, destination)),
        ammo: current.ammo + (gotWeapon ? 8 : 0),
        score: current.score + (gotEvidence ? 50 : 0) + (gotCoin ? 10 : 0),
        message: gotEvidence ? 'Evidence secured!' : gotWeapon ? 'Weapon found: 8 shots!' : gotCoin ? 'Bonus coin collected!' : 'Move carefully.',
      }
      const guardIndex = next.guards.findIndex(guard => samePoint(guard, destination))
      if (guardIndex >= 0) {
        const health = Math.max(0, current.health - 20)
        return { ...next, player: current.player, health, status: health === 0 ? 'failed' : 'playing', alert: 1, message: 'A guard hit you for 20 damage!' }
      }
      const seen = isSeen(next, level)
      if (seen) next = { ...next, alert: 1, message: 'A scanning beam found you—move before the guard fires!' }
      else next = { ...next, alert: 0, message: isHidden(next, level) ? 'Hidden. The patrol cannot see you.' : next.message }
      if (samePoint(destination, findTile(level, 'X'))) {
        return next.evidence.length === 0 ? { ...next, status: 'won', score: next.score + 100 } : { ...next, message: `${next.evidence.length} evidence file(s) still missing.` }
      }
      return next
    })
  }, [level])

  useEffect(() => {
    const timer = window.setInterval(() => setState(current => ({ ...current, stamina: Math.min(100, current.stamina + 2) })), 400)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    const animateCars = (now: number) => {
      const delta = Math.min(now - previous, 32)
      previous = now
      setState(current => {
      if (current.status !== 'playing') return current
      const maxX = level.map[0].length - 2
      let cars = current.cars.map(car => {
        const moved = car.x + car.direction * delta * .0016
        return { ...car, x: moved > maxX ? 1 : moved < 1 ? maxX : moved }
      })
      let bombs = current.bombs
      const bombedCar = cars.findIndex(car => bombs.some(bomb => bomb.y === car.y && Math.abs(bomb.x - car.x) < .35))
      if (bombedCar >= 0) {
        const hit = cars[bombedCar]
        bombs = bombs.filter(bomb => !(bomb.y === hit.y && Math.abs(bomb.x - hit.x) < .6))
        cars = hit.health <= 20 ? cars.filter((_, index) => index !== bombedCar) : cars.map((car, index) => index === bombedCar ? { ...car, health: car.health - 20 } : car)
      }
      const now = Date.now()
      const carHit = !current.isJumping && now - current.lastCarHit > 1200 && cars.some(car => car.y === current.player.y && Math.abs(car.x - current.player.x) < .45)
      const health = carHit ? Math.max(0, current.health - 20) : current.health
      return { ...current, cars, bombs, health, lastCarHit: carHit ? now : current.lastCarHit,
        status: health === 0 ? 'failed' : current.status, message: carHit ? 'A car hit you: -20 HP!' : bombedCar >= 0 ? 'Bomb hit a car for 20 damage!' : current.message }
      })
      frame = requestAnimationFrame(animateCars)
    }
    frame = requestAnimationFrame(animateCars)
    return () => cancelAnimationFrame(frame)
  }, [level])

  const jump = useCallback(() => {
    setState(current => current.status === 'playing' ? { ...current, isJumping: true, message: 'Jump!' } : current)
    window.setTimeout(() => setState(current => ({ ...current, isJumping: false })), 1100)
  }, [])

  const plantBomb = useCallback(() => {
    setState(current => {
      if (current.status !== 'playing') return current
      if (current.bombs.some(bomb => samePoint(bomb, current.player))) return { ...current, message: 'There is already a bomb here.' }
      return { ...current, bombs: [...current.bombs, { ...current.player }], message: 'Bomb planted. Move away!' }
    })
  }, [])

  useEffect(() => {
    const directions: Direction[] = ['up', 'right', 'down', 'left']
    const timer = window.setInterval(() => setState(current => {
      if (current.status !== 'playing') return current
      if (isHidden(current, level)) return { ...current, alert: 0, chasingGuardIndex: null, scanTick: current.scanTick + 1, message: 'Hidden. The guards lost your trail.' }
      let chaseIndex = current.chasingGuardIndex
      let guards = current.scanTick % 8 === 0
        ? current.guards.map((guard, index) => index === chaseIndex ? guard : movePatrols([guard])[0])
        : current.scanTick % 5 === 0 ? current.guards.map(guard => ({ ...guard, direction: directions[(directions.indexOf(guard.direction) + 1) % directions.length] })) : current.guards
      let bombs = current.bombs
      const bombedGuard = guards.findIndex(guard => bombs.some(bomb => samePoint(bomb, guard)))
      if (bombedGuard >= 0) {
        const hit = guards[bombedGuard]
        bombs = bombs.filter(bomb => !samePoint(bomb, hit))
        guards = hit.health <= 20 ? guards.filter((_, index) => index !== bombedGuard) : guards.map((guard, index) => index === bombedGuard ? { ...guard, health: guard.health - 20 } : guard)
        chaseIndex = null
      }
      if (chaseIndex !== null && guards[chaseIndex] && current.scanTick % 4 === 0) guards = guards.map((guard, index) => index === chaseIndex ? chaseTarget(guard, current.player, level) : guard)
      const scanningIndex = guards.findIndex(guard => inConeSight(guard, guard.direction, current.player, 3, level))
      if (chaseIndex === null && scanningIndex >= 0) chaseIndex = scanningIndex
      if (chaseIndex === null) return { ...current, guards, bombs, scanTick: current.scanTick + 1, alert: 0, message: bombedGuard >= 0 ? 'Bomb hit a guard for 20 damage!' : current.message }
      const chaser = guards[chaseIndex]
      if (samePoint(chaser, current.player)) {
        const health = Math.max(0, current.health - 20)
        guards = guards.map((guard, index) => index === chaseIndex ? { ...guard, ...guard.path[0], pathIndex: 0 } : guard)
        return { ...current, guards, bombs, health, status: health === 0 ? 'failed' : 'playing', alert: 0, chasingGuardIndex: null, message: 'The guard caught you: -20 HP!' }
      }
      const shooter = inConeSight(chaser, chaser.direction, current.player, 3, level) ? chaser : undefined
      if (!shooter || current.alert === 0) return { ...current, guards, bombs, chasingGuardIndex: chaseIndex, scanTick: current.scanTick + 1, alert: 1, message: 'TARGET LOCK! The guard is pursuing you—find a locker.' }
      const health = Math.max(0, current.health - 20)
      return {
        ...current, guards, bombs, health, chasingGuardIndex: chaseIndex, scanTick: current.scanTick + 1, alert: 1,
        shot: { from: shooter, to: current.player, kind: 'guard', id: Date.now() },
        status: health === 0 ? 'failed' : 'playing', message: health === 0 ? 'Guard fire defeated you.' : 'Guard shot: -20 HP! Find cover.',
      }
    }), 200)
    return () => window.clearInterval(timer)
  }, [level])

  const shootOnMap = useCallback(() => {
    setState(current => {
      if (current.status !== 'playing') return current
      if (current.ammo === 0) return { ...current, message: 'No ammo. Find an orange weapon crate.' }
      const targetIndex = current.guards.findIndex(guard =>
        (guard.x === current.player.x || guard.y === current.player.y) &&
        (['up', 'down', 'left', 'right'] as Direction[]).some(direction => inSight(current.player, direction, guard, 5, level)))
      if (targetIndex < 0) return { ...current, message: 'No guard in your line of fire.' }
      const target = current.guards[targetIndex]
      const health = target.health - 20
      const guards = health <= 0 ? current.guards.filter((_, index) => index !== targetIndex) : current.guards.map((guard, index) => index === targetIndex ? { ...guard, health } : guard)
      const chasingGuardIndex = health <= 0 && current.chasingGuardIndex === targetIndex ? null : current.chasingGuardIndex
      return { ...current, ammo: current.ammo - 1, guards, chasingGuardIndex, score: current.score + (health <= 0 ? 50 : 0),
        shot: { from: current.player, to: target, kind: 'player', id: Date.now() }, message: health <= 0 ? 'Guard defeated!' : `Hit! Guard has ${health} HP.` }
    })
  }, [level])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') { event.preventDefault(); jump(); return }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); plantBomb(); return }
      if (event.key.toLowerCase() === 'e') { event.preventDefault(); shootOnMap(); return }
      const direction = ({ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' } as Record<string, Direction>)[event.key]
      if (direction) {
        event.preventDefault()
        const sprinting = event.shiftKey && state.stamina > 0
        const now = Date.now()
        if (now - lastMove.current < (sprinting ? 90 : 250)) return
        lastMove.current = now
        move(direction, sprinting)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [jump, move, plantBomb, shootOnMap, state.stamina])

  const continueGame = () => {
    if (state.status === 'failed') { setLevelIndex(0); setState(makeState(LEVELS[0])); return }
    const nextLevel = levelIndex + 1
    if (nextLevel < LEVELS.length) { setLevelIndex(nextLevel); setState(makeState(LEVELS[nextLevel], state.score, state.lives)) }
    else { setLevelIndex(0); setState(makeState(LEVELS[0])) }
  }

  return <section className={`game-screen ${state.alert ? 'is-alert' : ''}`}>
    <GameHud level={levelIndex + 1} name={level.name} score={state.score} health={state.health} stamina={state.stamina} ammo={state.ammo} evidence={state.evidence.length} onQuit={onQuit} />
    <div className="game-dashboard">
      <MissionSidebar title={level.name} objective={level.subtitle} evidence={state.evidence.length} guards={state.guards.length} reward={level.reward} />
      <section className="map-console">
        <div className="map-toolbar"><span><i className={state.alert ? 'alert-light on' : 'alert-light'} />{state.alert ? 'ENEMY CONTACT' : 'UNDETECTED'}</span><b>{state.message}</b><span>SCAN {state.scanTick}</span></div>
        <GameBoard level={level} state={state} />
        <div className="map-footer"><div className="legend"><span>▣ Evidence</span><span>▤ Hide</span><span>⌖ Weapon</span><span>🚐 Exit</span></div><Controls onMove={move} onShoot={shootOnMap} onJump={jump} onBomb={plantBomb} /></div>
      </section>
      <EquipmentPanel health={state.health} stamina={state.stamina} ammo={state.ammo} score={state.score} />
    </div>
    {state.status === 'failed' && <MissionModal kind="failed" score={state.score} onAction={continueGame} />}
    {state.status === 'won' && <MissionModal kind={levelIndex === LEVELS.length - 1 ? 'finished' : 'level'} reward={level.reward} score={state.score} onAction={continueGame} />}
  </section>
}
