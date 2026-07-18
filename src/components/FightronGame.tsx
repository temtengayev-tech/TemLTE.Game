import { useCallback, useEffect, useRef, useState } from 'react'
import { combatProfiles, fighters, type FighterInfo, type GameSetup } from '../game/fighters'
import { FullscreenButton } from './FullscreenButton'
import { MobileFightControls } from './MobileFightControls'
import { PrefightCard } from './PrefightCard'

type Action = 'idle' | 'run' | 'jump' | 'shoot' | 'punch' | 'kick' | 'slide' | 'roundhouse' | 'stagger' | 'knockdown' | 'hardKnockdown' | 'missKnockdown'
type Side = 'player' | 'opponent'
type FighterState = { x: number; y: number; velocityX: number; velocityY: number; health: number; stamina: number; action: Action; actionUntil: number; actionId: number; hitId: number; hitBy: 'shot' | 'strike' | null; lastDamage: number; reloadUntil: number; ammo: number }
type Shot = { id: number; from: number; to: number; owner: Side }
type Score = Record<Side, number>
type RoundResult = { winner: Side | 'draw'; playerDamage: number; opponentDamage: number; playerRatio: number; opponentRatio: number }
type Arena = { player: FighterState; opponent: FighterState; cooldown: number; shot: Shot | null; result: 'playing' | Side; resultMethod: 'knockout' | 'decision' | null; round: number; roundTime: number; phase: 'fighting' | 'break' | 'countdown'; countdown: number; roundDamage: Score; totalDamage: Score; roundWins: Score; lastRound: RoundResult | null }

const newFighter = (x: number, health: number, stamina = 300): FighterState => ({ x, y: 0, velocityX: 0, velocityY: 0, health, stamina, action: 'idle', actionUntil: 0, actionId: 0, hitId: 0, hitBy: null, lastDamage: 0, reloadUntil: 0, ammo: 3 })
const emptyScore = (): Score => ({ player: 0, opponent: 0 })
const initialArena = (playerHealth: number, opponentHealth: number, roundTime = 20, playerStamina = 300, opponentStamina = 300): Arena => ({ player: newFighter(18, playerHealth, playerStamina), opponent: newFighter(82, opponentHealth, opponentStamina), cooldown: 1.2, shot: null, result: 'playing', resultMethod: null, round: 1, roundTime, phase: 'fighting', countdown: 0, roundDamage: emptyScore(), totalDamage: emptyScore(), roundWins: emptyScore(), lastRound: null })
const judgeRound = (damage: Score): RoundResult => {
  const total = damage.player + damage.opponent
  return { winner: damage.player === damage.opponent ? 'draw' : damage.player > damage.opponent ? 'player' : 'opponent', playerDamage: damage.player, opponentDamage: damage.opponent, playerRatio: total ? damage.player / total : .5, opponentRatio: total ? damage.opponent / total : .5 }
}
const clamp = (value: number) => Math.max(15, Math.min(85, value))
const GAME_SPEED = .68
const cannotAct = (action: Action) => ['stagger', 'knockdown', 'hardKnockdown', 'missKnockdown'].includes(action)

type CareerFightResult = { won: boolean; winner: FighterInfo['id']; method: 'knockout' | 'decision'; playerRounds: number; opponentRounds: number; finishRound: number }
export type CareerUpgrades = { health: number; stamina: number; damage: number; slide: number; roundhouse: number }
const noCareerUpgrades: CareerUpgrades = { health: 0, stamina: 0, damage: 0, slide: 0, roundhouse: 0 }

export function FightronGame({ setup, onExit, onCareerComplete, isTitleFight = true, titleDefense = false, careerEvent = 1, careerUpgrades = noCareerUpgrades }: { setup: GameSetup; onExit: () => void; onCareerComplete?: (result: CareerFightResult) => void; isTitleFight?: boolean; titleDefense?: boolean; careerEvent?: number; careerUpgrades?: CareerUpgrades }) {
  const playerInfo = fighters[setup.player]; const opponentInfo = fighters[setup.opponent]
  const maxRounds = setup.mode === 'shootout' ? 5 : setup.mode === 'brawl' ? 1 : 3
  const roundDuration = setup.mode === 'short' ? 15 : setup.mode === 'brawl' ? Number.POSITIVE_INFINITY : 20
  const unlimitedStamina = setup.mode === 'brawl'
  const growth = setup.mode === 'career' ? Math.min(10, Math.max(0, careerEvent - 1)) : 0
  const playerProfile = combatProfiles[playerInfo.id]; const opponentProfile = combatProfiles[opponentInfo.id]
  const playerMaxHealth = setup.mode === 'brawl' ? 500 : playerInfo.maxHealth + Math.round(growth * 10 * playerProfile.healthGrowth) + careerUpgrades.health * 20; const opponentMaxHealth = setup.mode === 'brawl' ? 500 : opponentInfo.maxHealth + Math.round(growth * 10 * opponentProfile.healthGrowth)
  const playerMaxStamina = 300 + Math.round(growth * 6 * playerProfile.staminaGrowth) + careerUpgrades.stamina * 15; const opponentMaxStamina = 300 + Math.round(growth * 6 * opponentProfile.staminaGrowth)
  const isVersus = setup.mode === 'versus'; const isMmaMode = ['mma', 'career', 'shootout', 'short', 'brawl'].includes(setup.mode); const isMma = isMmaMode || (playerInfo.special === 'kick' && opponentInfo.special === 'kick')
  const playerSpecial = isMmaMode ? 'kick' : playerInfo.special; const opponentSpecial = isMmaMode ? 'kick' : opponentInfo.special
  const [arena, setArena] = useState(() => initialArena(playerMaxHealth, opponentMaxHealth, roundDuration, playerMaxStamina, opponentMaxStamina)); const arenaRef = useRef(arena); const keys = useRef(new Set<string>()); const previous = useRef(performance.now()); const lastAttack = useRef({ player: 0, opponent: 0 }); const reloads = useRef({ player: 0, opponent: 0 }); const ammo = useRef({ player: 3, opponent: 3 }); const jumpBuffer = useRef({ player: 0, opponent: 0 })
  const lastSlide = useRef({ player: -7000, opponent: -7000 })
  const lastRoundhouse = useRef({ player: -8000, opponent: -8000 })
  const [showPrefight, setShowPrefight] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const isMobile = useRef(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  const beltAward = arena.result !== 'playing' && isTitleFight
  const defendingChampionWon = beltAward && ((titleDefense && arena.result === 'player') || (!titleDefense && arena.result === 'opponent'))
  const finishCareerFight = () => {
    if (!onCareerComplete || arena.result === 'playing') return
    onCareerComplete({ won: arena.result === 'player', winner: arena.result === 'player' ? playerInfo.id : opponentInfo.id, method: arena.resultMethod ?? 'decision', playerRounds: arena.roundWins.player, opponentRounds: arena.roundWins.opponent, finishRound: arena.round })
  }
  useEffect(() => { arenaRef.current = arena }, [arena])

  const jumpPlayer = useCallback(() => {
    if (showPrefight || isPaused || arenaRef.current.phase !== 'fighting') return
    setArena(current => {
      const player = current.player
      return player.y === 0 && !cannotAct(player.action)
        ? { ...current, player: { ...player, velocityY: 420, action: 'jump', actionUntil: performance.now() + 950 } }
        : current
    })
  }, [isPaused, showPrefight])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyI', 'KeyJ', 'KeyL'].includes(event.code)) event.preventDefault()
      if (arenaRef.current.phase !== 'fighting' || showPrefight || isPaused) return
      keys.current.add(event.code)
      if (!event.repeat && (event.code === 'Space' || event.code === 'KeyW' || (isVersus && event.code === 'KeyI'))) setArena(current => {
        const side: Side = event.code === 'KeyI' ? 'opponent' : 'player'; const jumper = current[side]
        jumpBuffer.current[side] = performance.now() + 140
        return jumper.y === 0 && !cannotAct(jumper.action) ? { ...current, [side]: { ...jumper, velocityY: 420, action: 'jump', actionUntil: performance.now() + 950 } } : current
      })
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [isPaused, isVersus, showPrefight])

  const attack = useCallback((side: Side, kind: 'special' | 'punch' | 'slide' | 'roundhouse') => {
    if (showPrefight || isPaused) return
    if (arenaRef.current.phase !== 'fighting') return
    if (cannotAct(arenaRef.current[side].action)) return
    const now = performance.now()
    const special = side === 'player' ? playerSpecial : opponentSpecial; const action: Action = kind === 'punch' ? 'punch' : kind === 'slide' ? 'slide' : kind === 'roundhouse' ? 'roundhouse' : special
    if (action === 'slide' && now - lastSlide.current[side] < 5000) return
    if (action === 'roundhouse' && now - lastRoundhouse.current[side] < 6000) return
    const attackProfile = side === 'player' ? playerProfile : opponentProfile
    const attackDelay = (action === 'punch' ? 420 : action === 'kick' ? 380 : action === 'roundhouse' ? 1000 : 340) / attackProfile.attackSpeed
    if (now - lastAttack.current[side] < attackDelay) return
    const staminaCost = action === 'roundhouse' ? 30 : action === 'slide' ? 20 : action === 'shoot' ? 10 : action === 'kick' ? 15 : 8
    if (!unlimitedStamina && arenaRef.current[side].stamina < staminaCost) return
    if (action === 'shoot' && now < reloads.current[side]) return
    if (action === 'shoot' && ammo.current[side] === 0) ammo.current[side] = 3
    lastAttack.current[side] = now
    if (action === 'slide') lastSlide.current[side] = now
    if (action === 'roundhouse') lastRoundhouse.current[side] = now
    if (action === 'shoot') {
      ammo.current[side] -= 1
      if (ammo.current[side] === 0) {
        reloads.current[side] = now + 2000
        window.setTimeout(() => { ammo.current[side] = 3; reloads.current[side] = 0; setArena(current => ({ ...current, [side]: { ...current[side], ammo: 3, reloadUntil: 0 } })) }, 2000)
      }
    }
    setArena(current => {
      const attacker = current[side]; const target = current[side === 'player' ? 'opponent' : 'player']; const direction = Math.sign(target.x - attacker.x) || 1
      const shot = action === 'shoot' ? { id: now, from: attacker.x + direction * 4, to: target.x, owner: side } : current.shot
      return { ...current, shot, [side]: { ...attacker, x: action === 'slide' ? clamp(attacker.x + direction * 4) : attacker.x, stamina: unlimitedStamina ? 300 : Math.max(0, attacker.stamina - staminaCost), action, actionUntil: now + (action === 'punch' ? 390 : action === 'kick' ? 390 : action === 'roundhouse' ? 1000 : action === 'slide' ? 720 : 540), actionId: attacker.actionId + 1, ammo: ammo.current[side], reloadUntil: action === 'shoot' && ammo.current[side] === 0 ? now + 2000 : attacker.reloadUntil } }
    })
    if (action === 'shoot') window.setTimeout(() => setArena(current => current.shot?.id === now ? { ...current, shot: null } : current), 270)
    window.setTimeout(() => setArena(current => {
      if (current.result !== 'playing') return current
      const attacker = current[side]; const targetSide: Side = side === 'player' ? 'opponent' : 'player'; const target = current[targetSide]
      const distance = Math.abs(attacker.x - target.x); const closeRange = action === 'punch' ? 11 : action === 'slide' ? 22 : action === 'roundhouse' ? 18 : 15
      const targetHeightValid = action === 'slide' ? target.y < 4 : action === 'roundhouse' ? target.y < 12 : target.y < 18
      const roundhouseFailed = action === 'roundhouse' && Math.random() < .3
      const baseDamage = action === 'roundhouse' ? 60 : action === 'slide' ? 30 : action === 'kick' ? 20 : 10
      const attackerInfo = side === 'player' ? playerInfo : opponentInfo; const attackerProfile = side === 'player' ? playerProfile : opponentProfile
      const boughtTechnique = side === 'player' ? action === 'slide' ? careerUpgrades.slide * 5 : action === 'roundhouse' ? careerUpgrades.roundhouse * 4 : 0 : 0
      const techniqueBonus = (action === 'slide' && ['islam', 'khabibi'].includes(attackerInfo.id) ? 10 : action === 'roundhouse' && ['conor', 'chalres'].includes(attackerInfo.id) ? 8 : action === 'punch' && attackerInfo.id === 'agent' ? 6 : 0) + boughtTechnique
      const moveMultiplier = action === 'punch' ? attackerProfile.punch : action === 'kick' ? attackerProfile.kick : action === 'slide' ? attackerProfile.slide : action === 'roundhouse' ? attackerProfile.roundhouse : 1
      const careerDamage = growth * 2 * attackerProfile.damageGrowth + (side === 'player' ? careerUpgrades.damage * 3 : 0)
      const rawDamage = action === 'shoot' ? (distance <= 62 && target.y < 23 ? Math.round((20 + careerDamage) * moveMultiplier) : 0) : distance <= closeRange && targetHeightValid && !roundhouseFailed ? Math.round((baseDamage + careerDamage + techniqueBonus) * moveMultiplier) : 0
      if (action === 'slide' && rawDamage === 0) return { ...current, [side]: { ...attacker, action: 'missKnockdown', actionUntil: now + 2000 } }
      if (action === 'roundhouse' && rawDamage === 0) return current
      const damage = rawDamage; const inflictedDamage = Math.min(damage, target.health); const knockDirection = Math.sign(target.x - attacker.x) || 1
      const targetMaxHealth = targetSide === 'player' ? playerMaxHealth : opponentMaxHealth; const healthAfterHit = Math.max(0, target.health - damage); const healthRatio = healthAfterHit / targetMaxHealth
      const countered = ['punch', 'kick', 'shoot', 'slide', 'roundhouse'].includes(target.action); const slideReaction: Action = countered || healthRatio < .5 ? 'hardKnockdown' : 'knockdown'
      const reactionTime = healthRatio >= .75 ? 2000 : healthRatio >= .5 ? 3000 : 4000
      const reaction: Action = action === 'roundhouse' ? 'stagger' : action === 'slide' && rawDamage ? slideReaction : target.action
      const stunTime = healthRatio >= .75 ? 1000 : healthRatio >= .5 ? 2000 : 3000
      const boughtStun = side === 'player' ? careerUpgrades.roundhouse * 200 : 0
      const reactionUntil = action === 'roundhouse' ? now + stunTime + boughtStun : action === 'slide' && rawDamage ? now + reactionTime : target.actionUntil
      return { ...current, roundDamage: { ...current.roundDamage, [side]: current.roundDamage[side] + inflictedDamage }, totalDamage: { ...current.totalDamage, [side]: current.totalDamage[side] + inflictedDamage }, [targetSide]: { ...target, x: action === 'slide' && rawDamage ? clamp(target.x + knockDirection * (countered ? 13 : 8)) : target.x, health: healthAfterHit, action: reaction, actionUntil: reactionUntil, hitId: damage ? now : target.hitId, hitBy: damage ? (action === 'shoot' ? 'shot' : 'strike') : target.hitBy, lastDamage: damage || target.lastDamage } }
    }), action === 'punch' ? 165 : action === 'kick' ? 150 : action === 'roundhouse' ? 540 : action === 'slide' ? 310 : 225)
  }, [careerUpgrades, growth, isPaused, opponentMaxHealth, opponentProfile, opponentSpecial, playerMaxHealth, playerProfile, playerSpecial, showPrefight, unlimitedStamina])

  useEffect(() => {
    const onAttack = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.code === 'KeyE') attack('player', 'special'); if (event.code === 'KeyF') attack('player', 'punch')
      if (event.code === 'KeyR') attack('player', 'slide')
      if (event.code === 'KeyT') attack('player', 'roundhouse')
      if (isVersus && event.code === 'KeyO') attack('opponent', 'special'); if (isVersus && event.code === 'KeyP') attack('opponent', 'punch')
      if (isVersus && event.code === 'KeyY') attack('opponent', 'slide')
      if (isVersus && event.code === 'KeyH') attack('opponent', 'roundhouse')
    }
    window.addEventListener('keydown', onAttack); return () => window.removeEventListener('keydown', onAttack)
  }, [attack, isVersus])

  useEffect(() => {
    let frame = 0
    const update = (now: number) => {
      if (isMobile.current && now - previous.current < 32) {
        frame = requestAnimationFrame(update)
        return
      }
      const dt = Math.min((now - previous.current) / 1000, .02); previous.current = now
      setArena(current => {
        if (current.result !== 'playing' || showPrefight || isPaused) return current
        if (current.phase === 'break') return current
        if (current.phase === 'countdown') { const countdown = Math.max(0, current.countdown - dt); return { ...current, countdown, phase: countdown === 0 ? 'fighting' : 'countdown', roundTime: roundDuration } }
        const motionDt = dt * GAME_SPEED
        const move = (state: FighterState, left: boolean, right: boolean, speed: number, side: Side) => {
          if (cannotAct(state.action) && now < state.actionUntil) return { ...state, velocityX: 0 }
          const direction = Number(right) - Number(left); const sprint = keys.current.has('ShiftLeft') && state.stamina > 0
          const targetVelocity = direction * speed * (sprint ? 1.5 : 1); const smoothing = 1 - Math.exp(-18 * motionDt)
          const velocityX = state.velocityX + (targetVelocity - state.velocityX) * smoothing
          const next = { ...state, velocityX, x: clamp(state.x + velocityX * motionDt), stamina: unlimitedStamina ? 300 : sprint && direction ? Math.max(0, state.stamina - 24 * motionDt) : state.stamina }
          next.velocityY -= 900 * motionDt; next.y = Math.max(0, next.y + next.velocityY * motionDt); if (next.y === 0) next.velocityY = 0
          if (next.y === 0 && jumpBuffer.current[side] > now) { next.velocityY = 420; next.action = 'jump'; next.actionUntil = now + 950; jumpBuffer.current[side] = 0 }
          if (next.y > 0) next.action = 'jump'; else if (now >= next.actionUntil) next.action = direction ? 'run' : 'idle'
          return next
        }
        let player = move(current.player, keys.current.has('ArrowLeft') || keys.current.has('KeyA'), keys.current.has('ArrowRight') || keys.current.has('KeyD'), playerInfo.speed, 'player')
        let opponent = isVersus ? move(current.opponent, keys.current.has('KeyJ'), keys.current.has('KeyL'), opponentInfo.speed, 'opponent') : move(current.opponent, false, false, opponentInfo.speed, 'opponent')
        let cooldown = current.cooldown - motionDt
        if (!isVersus) {
          const distance = Math.abs(opponent.x - player.x); const stop = opponentSpecial === 'shoot' ? 28 : 10
          const needsSpace = opponent.stamina < 35 && distance < 18
          if (needsSpace) opponent.x = clamp(opponent.x - Math.sign(player.x - opponent.x) * opponentInfo.speed * .55 * motionDt)
          else if (distance > stop) opponent.x = clamp(opponent.x + Math.sign(player.x - opponent.x) * opponentInfo.speed * .65 * motionDt)
          if (now >= opponent.actionUntil) opponent.action = distance > stop ? 'run' : 'idle'
          const seesIncomingShot = player.action === 'shoot' && distance > 16 && distance < 62
          if (opponent.y === 0 && seesIncomingShot && Math.random() < .08) { opponent.velocityY = 420; opponent.action = 'jump'; opponent.actionUntil = now + 950 }
          if (cooldown <= 0) {
            const canPunch = distance <= 11 && player.y < 18
            const canSpecial = distance < (opponentSpecial === 'shoot' ? 60 : 15)
            const canSlide = distance <= 22 && player.y < 4 && opponent.stamina >= 20 && now - lastSlide.current.opponent >= 5000
            const canRoundhouse = distance <= 18 && player.y < 12 && opponent.stamina >= 35 && now - lastRoundhouse.current.opponent >= 6000
            const playerAttacking = ['punch', 'kick', 'shoot', 'slide', 'roundhouse'].includes(player.action)
            if (canRoundhouse && Math.random() < .22) {
              cooldown = 1.2; window.setTimeout(() => attack('opponent', 'roundhouse'), 0)
            } else if (canSlide && (playerAttacking || Math.random() < .32)) {
              cooldown = 1.05; window.setTimeout(() => attack('opponent', 'slide'), 0)
            } else if (canPunch || canSpecial) {
              const usePunch = canPunch && (opponentSpecial === 'shoot' || Math.random() < .48)
              cooldown = setup.opponent === 'conor' ? .48 : .68
              window.setTimeout(() => attack('opponent', usePunch ? 'punch' : 'special'), 0)
            } else if (opponent.y === 0 && Math.random() < .18) {
              opponent.velocityY = 420; opponent.action = 'jump'; opponent.actionUntil = now + 950; cooldown = .75
            } else cooldown = .2
          }
        }
        const roundTime = Math.max(0, current.roundTime - dt)
        if (player.health <= 0 || opponent.health <= 0) return { ...current, player, opponent, cooldown, roundTime, result: player.health <= 0 ? 'opponent' : 'player', resultMethod: 'knockout' }
        if (roundTime === 0 && current.roundTime > 0) {
          const lastRound = judgeRound(current.roundDamage)
          const roundWins = { ...current.roundWins }
          if (lastRound.winner !== 'draw') roundWins[lastRound.winner] += 1
          if (current.round === maxRounds) {
            const result: Side = roundWins.player === roundWins.opponent ? (current.totalDamage.player >= current.totalDamage.opponent ? 'player' : 'opponent') : roundWins.player > roundWins.opponent ? 'player' : 'opponent'
            return { ...current, player, opponent, cooldown, roundTime, roundWins, lastRound, result, resultMethod: 'decision' }
          }
          return { ...current, player, opponent, cooldown, roundTime, roundWins, lastRound, phase: 'break' }
        }
        return { ...current, player, opponent, cooldown, roundTime }
      })
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame)
  }, [attack, isPaused, isVersus, maxRounds, opponentInfo, opponentSpecial, playerInfo, roundDuration, setup.opponent, showPrefight])

  return <main className="fight-screen"><header className="fight-hud"><button onClick={onExit}>← MENU</button><h1>FIGHTRON</h1><div className="fight-hud-tools"><span>{isVersus ? 'LOCAL 2 PLAYER' : isMma ? 'MMA MODE' : 'NORMAL MODE'}</span><button className="pause-button" onClick={() => setIsPaused(true)}>Ⅱ PAUSE</button><FullscreenButton /></div></header>
    {arena.result === 'playing' && <section className={isMma ? 'fight-bars mma-scoreboard' : 'fight-bars'}><Health fighter={arena.player} info={playerInfo} maxHealth={playerMaxHealth} maxStamina={playerMaxStamina} side="P1" special={playerSpecial} slideCooldown={Math.max(0, 5 - (performance.now() - lastSlide.current.player) / 1000)} /><strong>ROUND {arena.round}<small className="round-clock">{Number.isFinite(arena.roundTime) ? Math.ceil(arena.roundTime) : '∞'}</small><small className="round-score">{arena.roundWins.player} — {arena.roundWins.opponent}</small></strong><Health fighter={arena.opponent} info={opponentInfo} maxHealth={opponentMaxHealth} maxStamina={opponentMaxStamina} side={isVersus ? 'P2' : 'CPU'} special={opponentSpecial} slideCooldown={Math.max(0, 5 - (performance.now() - lastSlide.current.opponent) / 1000)} /></section>}
    <section className={isMma ? 'side-arena mma-arena' : 'side-arena'}><Backdrop mma={isMma} />
      {(arena.result === 'playing' || arena.result === 'player') && <Fighter fighter={arena.player} info={playerInfo} side="player" targetX={arena.opponent.x} mmaAgent={setup.mode === 'mma' && setup.player === 'agent'} winner={beltAward && arena.result === 'player'} celebrating={arena.result === 'player'} />}
      {(arena.result === 'playing' || arena.result === 'opponent') && <Fighter fighter={arena.opponent} info={opponentInfo} side="opponent" targetX={arena.player.x} mmaAgent={setup.mode === 'mma' && setup.opponent === 'agent'} winner={beltAward && arena.result === 'opponent'} celebrating={arena.result === 'opponent'} />}
      {arena.result !== 'playing' && <AwardReferee />}
      {arena.shot && <ShotLine shot={arena.shot} />}<div className="pavement" /><div className="road"><span /><span /><span /></div>
      {arena.result !== 'playing' && <VictoryCelebration winner={arena.result === 'player' ? playerInfo : opponentInfo} side={arena.result} method={arena.resultMethod} titleFight={beltAward} defending={defendingChampionWon} />}
      {arena.phase !== 'fighting' && arena.result === 'playing' && <RoundBreak arena={arena} player={playerInfo} opponent={opponentInfo} onStart={() => setArena(current => ({ ...current, round: current.round + 1, phase: 'countdown', countdown: 3, roundTime: roundDuration, roundDamage: emptyScore(), player: { ...current.player, x: 18, health: Math.min(playerMaxHealth, current.player.health + 100), stamina: playerMaxStamina, action: 'idle' }, opponent: { ...current.opponent, x: 82, health: Math.min(opponentMaxHealth, current.opponent.health + 100), stamina: opponentMaxStamina, action: 'idle' } }))} />}
    </section><footer className="fight-controls">P1: WASD / ARROWS <b>SPACE / W JUMP</b><b>R SLIDE</b><b>T ROUNDHOUSE</b><b>E {playerSpecial.toUpperCase()}</b><b>F PUNCH</b>{isVersus && <> P2: J/L MOVE <b>I JUMP</b><b>Y SLIDE</b><b>H ROUNDHOUSE</b><b>O {opponentSpecial.toUpperCase()}</b><b>P PUNCH</b></>}</footer>
    <MobileFightControls specialLabel={playerSpecial.toUpperCase()} onMoveStart={direction => {
      keys.current.delete(direction === 'left' ? 'ArrowRight' : 'ArrowLeft')
      keys.current.add(direction === 'left' ? 'ArrowLeft' : 'ArrowRight')
    }} onMoveEnd={() => { keys.current.delete('ArrowLeft'); keys.current.delete('ArrowRight') }} onJump={jumpPlayer} onAttack={kind => attack('player', kind)} />
    {arena.result !== 'playing' && <div className="fight-result"><h2>{arena.result === 'player' ? playerInfo.name : opponentInfo.name} WINS!</h2>{onCareerComplete ? <button onClick={finishCareerFight}>RETURN TO CAREER HUB</button> : <><button onClick={() => { ammo.current = { player: 3, opponent: 3 }; reloads.current = { player: 0, opponent: 0 }; lastSlide.current = { player: -7000, opponent: -7000 }; lastRoundhouse.current = { player: -8000, opponent: -8000 }; setArena(initialArena(playerMaxHealth, opponentMaxHealth, roundDuration, playerMaxStamina, opponentMaxStamina)); setShowPrefight(true) }}>REMATCH</button><button onClick={onExit}>MENU</button></>}</div>}
    {showPrefight && <PrefightCard player={playerInfo} opponent={opponentInfo} mode={setup.mode} onStart={() => {
      previous.current = performance.now()
      setArena(current => ({ ...current, phase: 'countdown', countdown: 3 }))
      setShowPrefight(false)
    }} />}
    {isPaused && <div className="pause-overlay" role="dialog" aria-modal="true"><small>FIGHTRON MMA</small><h2>FIGHT PAUSED</h2><button onClick={() => { previous.current = performance.now(); setIsPaused(false) }}>RESUME FIGHT</button><button onClick={onExit}>EXIT TO MENU</button></div>}
  </main>
}

function Health({ fighter, info, maxHealth, maxStamina, side, special, slideCooldown }: { fighter: FighterState; info: FighterInfo; maxHealth: number; maxStamina: number; side: string; special: 'shoot' | 'kick'; slideCooldown: number }) { const reloading = fighter.reloadUntil > performance.now(); return <div className={`fighter-hud hud-${info.id}`}><span className={`hud-portrait frame-sprite ${info.sheet} action-idle`} /><section><em>{side} • {reloading ? 'RELOADING • 2 SECONDS' : special === 'shoot' ? `AMMO ${fighter.ammo} / 3` : info.style}</em><b>{info.name}</b><div className="health-track"><i style={{ width: `${fighter.health / maxHealth * 100}%` }} /></div><small key={fighter.hitId} className={fighter.hitId ? 'hp-readout changed' : 'hp-readout'}>HP: {Math.round(fighter.health)} / {maxHealth}</small><div className="stamina-track"><i style={{ width: `${fighter.stamina / maxStamina * 100}%` }} /></div><small>STAMINA: {Math.round(fighter.stamina)} / {maxStamina} · SLIDE {slideCooldown > 0 ? `${slideCooldown.toFixed(1)}s` : 'READY'}</small></section></div> }
function Fighter({ fighter, info, side, targetX, mmaAgent, winner, celebrating }: { fighter: FighterState; info: FighterInfo; side: Side; targetX: number; mmaAgent: boolean; winner: boolean; celebrating: boolean }) {
  const striking = ['punch', 'kick', 'slide', 'roundhouse'].includes(fighter.action)
  const mirrored = (targetX < fighter.x) !== (info.baseFacing === 'left')
  const sheet = mmaAgent ? 'agent-mma-frames' : info.sheet
  const healthRatio = fighter.health / info.maxHealth
  const reactionTier = healthRatio >= .75 ? 'reaction-3' : healthRatio >= .5 ? 'reaction-4' : 'reaction-5'
  const groundedAction = ['slide', 'roundhouse', 'stagger', 'knockdown', 'hardKnockdown', 'missKnockdown'].includes(fighter.action)
  const swept = fighter.lastDamage === 30 && groundedAction
  const damageLabel = `-${fighter.lastDamage}${swept ? ' LOW SWEEP' : ''}`
  const isGunlessFighter = info.id === 'agent' || info.id === 'officer'
  const visualAction: Action = fighter.action === 'slide'
    ? 'punch'
    : fighter.action === 'roundhouse'
      ? isGunlessFighter ? 'punch' : 'kick'
      : ['stagger', 'knockdown', 'hardKnockdown', 'missKnockdown'].includes(fighter.action)
        ? 'idle'
        : fighter.action === 'kick' && isGunlessFighter ? 'punch' : fighter.action
  return <div translate="no" className={`fighter fighter-${info.id} ${side}-side ${fighter.health <= 0 ? 'knocked-out' : ''} ${winner ? 'victory-pose' : celebrating ? 'standard-winner-pose' : ''} ${reactionTier}`} style={{ left: `${clamp(fighter.x)}%`, bottom: `${74 + (groundedAction ? 0 : Math.max(0, fighter.y))}px` }}>
    <div className={`fighter-facing ${!winner && mirrored ? 'mirrored' : ''}`}><div className={fighter.hitId ? 'damage-react' : ''}>
      {winner ? <div className="champion-animation" style={{ backgroundImage: `url('/assets/${info.id}-champion-frames.png')` }} aria-label={`${info.name} raising both hands with the FCB belt`} /> : celebrating ? <div className={`standard-winner-animation frame-sprite ${sheet} action-idle`} aria-label={`${info.name} raising both arms`} /> : <div className={`frame-sprite ${sheet} action-${visualAction}`} />}
      {striking && fighter.health > 0 && !celebrating && <i className={`hitbox ${fighter.action}`} />}
      {fighter.action === 'hardKnockdown' && <i className="counter-stars" aria-label="Stunned" />}
      {fighter.hitId > 0 && !celebrating && <><i className={`fighter-impact ${fighter.hitBy}`} /><b className={`damage-number ${swept ? 'low-sweep-damage' : ''}`} data-label={damageLabel} aria-label={damageLabel} /></>}
    </div></div>
  </div>
}
function ShotLine({ shot }: { shot: Shot }) { const left = Math.min(shot.from, shot.to); return <div key={shot.id} className={`side-shot ${shot.owner} ${shot.to < shot.from ? 'reverse' : ''}`} style={{ left: `${left}%`, width: `${Math.abs(shot.to - shot.from)}%` }}><i className="flying-bullet" /><i className="bullet-trail" /></div> }
function AwardReferee() { return <img className="award-referee" src="/assets/referee-award.png" alt="Referee raising the winner's hand" /> }
function VictoryCelebration({ winner, side, method, titleFight, defending }: { winner: FighterInfo; side: Side; method: Arena['resultMethod']; titleFight: boolean; defending: boolean }) { const result = method === 'decision' ? 'DECISION' : 'KNOCKOUT'; return <div className={`victory-celebration ${side} ${titleFight ? 'title-victory' : 'standard-victory'}`}><div className="winner-callout">{titleFight ? <><small>{defending ? 'AND STILL · DEFENDING' : 'AND THE NEW UNDISPUTED'}</small><span>FCB CHAMPION OF THE WORLD</span></> : <small>THE WINNER BY {result} IS</small>}<strong>{winner.name}</strong>{titleFight && <em>WINNER BY {result}</em>}</div>{titleFight && <div className="corner-team" aria-label={`${winner.name}'s team celebrating`}><i /><i /><i /></div>}<div className="celebration-confetti">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div></div> }
function RoundBreak({ arena, player, opponent, onStart }: { arena: Arena; player: FighterInfo; opponent: FighterInfo; onStart: () => void }) {
  const roundWinner = arena.lastRound?.winner === 'draw' ? 'ROUND DRAW' : arena.lastRound?.winner === 'player' ? `${player.name} WINS ROUND` : `${opponent.name} WINS ROUND`
  return <div className={`round-break ${arena.phase}`}><i className={`break-fighter frame-sprite ${player.sheet} action-idle`} /><section><small>{arena.phase === 'break' ? roundWinner : 'GET READY'}</small><h2>{arena.phase === 'break' ? `${arena.roundWins.player} — ${arena.roundWins.opponent}` : Math.max(1, Math.ceil(arena.countdown))}</h2>{arena.phase === 'break' && arena.lastRound ? <><div className="round-damage-ratio"><span><b>{Math.round(arena.lastRound.playerRatio * 100)}%</b>{Math.round(arena.lastRound.playerDamage)} DAMAGE</span><i><em style={{ width: `${arena.lastRound.playerRatio * 100}%` }} /></i><span><b>{Math.round(arena.lastRound.opponentRatio * 100)}%</b>{Math.round(arena.lastRound.opponentDamage)} DAMAGE</span></div><p>ROUNDS WON · +100 HP · +250 STAMINA</p><button onClick={onStart}>START ROUND {arena.round + 1}</button></> : <p>FIGHT!</p>}</section><i className={`break-fighter opponent frame-sprite ${opponent.sheet} action-idle`} /></div>
}
function Backdrop({ mma }: { mma: boolean }) { return mma ? <><div className="arena-lights"><i /><i /><i /><i /><i /></div><div className="championship-sign"><small>FIGHTRON</small>MMA<span>CHAMPIONSHIP</span></div><div className="arena-crowd">{Array.from({ length: 56 }, (_, i) => <i key={i} />)}</div><div className="cage-wall" /><div className="ring-post post-left">FIGHTRON</div><div className="ring-post post-right">FIGHTRON</div><div className="canvas-logo">FIGHTRON<small>MMA CHAMPIONSHIP</small></div><div className="ring-sponsor sponsor-left">FIGHT HARD</div><div className="ring-sponsor sponsor-right">FIGHTRON GYM</div></> : <><div className="city-sun" /><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="far-skyline">{[1,2,3,4,5,6,7,8].map(i => <i key={i} />)}</div><div className="skyline">{[1,2,3,4,5,6].map(i => <i key={i}><span /><span /><span /><span /></i>)}</div><div className="street-sign">FIGHTRON AVENUE</div></> }
