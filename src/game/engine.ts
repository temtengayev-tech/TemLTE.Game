import type { Direction, GameState, Level, Patrol, Point } from './types'

export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export function findAll(level: Level, tile: string): Point[] {
  return level.map.flatMap((row, y) => [...row].flatMap((cell, x) => cell === tile ? [{ x, y }] : []))
}

export function findTile(level: Level, tile: string) {
  return findAll(level, tile)[0] ?? { x: 1, y: 1 }
}

const startPatrol = (patrol: Omit<Patrol, 'pathIndex' | 'health'>): Patrol => ({ ...patrol, pathIndex: 0, health: 100 })

export function makeState(level: Level, score = 0, lives = 3): GameState {
  const carColors = ['#d63f45', '#2866ad', '#d5a62e']
  return {
    player: findTile(level, 'P'), guards: level.guards.map(startPatrol), dogs: level.dogs.map(startPatrol),
    evidence: findAll(level, 'D'), coins: findAll(level, 'C'), weapons: findAll(level, 'W'), score, lives, alert: 0, turn: 0,
    status: 'playing', message: 'Collect every blue file, then reach the extraction van.',
    health: 100, ammo: 0, scanTick: 0, shot: null, chasingGuardIndex: null,
    cars: level.roadRows.map((y, index) => ({ x: index % 2 === 0 ? 1 : level.map[0].length - 2, y, direction: index % 2 === 0 ? 1 : -1, color: carColors[index % carColors.length], health: 100 })),
    isJumping: false, lastCarHit: 0, bombs: [], stamina: 100,
  }
}

export function step(point: Point, direction: Direction): Point {
  const [x, y] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction]
  return { x: point.x + x, y: point.y + y }
}

export function canWalk(level: Level, point: Point) {
  const tile = level.map[point.y]?.[point.x]
  return Boolean(tile && tile !== '#')
}

export function movePatrols(patrols: Patrol[]): Patrol[] {
  return patrols.map(patrol => {
    let nextIndex = patrol.pathIndex + 1
    let path = patrol.path
    if (nextIndex >= path.length) { path = [...path].reverse(); nextIndex = 1 }
    const next = path[nextIndex] ?? patrol
    const direction: Direction = next.x > patrol.x ? 'right' : next.x < patrol.x ? 'left' : next.y > patrol.y ? 'down' : 'up'
    return { ...patrol, ...next, direction, path, pathIndex: nextIndex }
  })
}

export function chaseTarget(guard: Patrol, target: Point, level: Level): Patrol {
  const horizontal = { x: guard.x + Math.sign(target.x - guard.x), y: guard.y }
  const vertical = { x: guard.x, y: guard.y + Math.sign(target.y - guard.y) }
  const choices = Math.abs(target.x - guard.x) >= Math.abs(target.y - guard.y) ? [horizontal, vertical] : [vertical, horizontal]
  const next = choices.find(point => canWalk(level, point)) ?? guard
  const direction: Direction = next.x > guard.x ? 'right' : next.x < guard.x ? 'left' : next.y > guard.y ? 'down' : 'up'
  return { ...guard, ...next, direction }
}

export function inSight(origin: Point, direction: Direction, target: Point, range: number, level: Level) {
  let cursor = origin
  for (let distance = 0; distance < range; distance += 1) {
    cursor = step(cursor, direction)
    if (!canWalk(level, cursor)) return false
    if (samePoint(cursor, target)) return true
  }
  return false
}

export function inConeSight(origin: Point, direction: Direction, target: Point, range: number, level: Level) {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const forward = direction === 'up' ? -dy : direction === 'down' ? dy : direction === 'left' ? -dx : dx
  const sideways = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy)
  if (forward <= 0 || sideways > forward || Math.hypot(dx, dy) > range) return false
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  for (let index = 1; index < steps; index += 1) {
    const point = { x: Math.round(origin.x + dx * index / steps), y: Math.round(origin.y + dy * index / steps) }
    if (!canWalk(level, point)) return false
  }
  return true
}

export function isHidden(state: GameState, level: Level) {
  return level.map[state.player.y][state.player.x] === 'H'
}

export function isSeen(state: GameState, level: Level) {
  if (isHidden(state, level)) return false
  const guardSeen = state.guards.some(guard => samePoint(guard, state.player) || inConeSight(guard, guard.direction, state.player, 3, level))
  const dogSeen = state.dogs.some(dog => samePoint(dog, state.player) ||
    (Math.abs(dog.x - state.player.x) + Math.abs(dog.y - state.player.y) === 1))
  return guardSeen || dogSeen || level.cameras.some(camera => inSight(camera, camera.direction, state.player, camera.range, level))
}
