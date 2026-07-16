export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'

export type Patrol = Point & {
  path: Point[]
  pathIndex: number
  direction: Direction
  health: number
}

export type Camera = Point & { direction: Direction; range: number }
export type Car = { x: number; y: number; direction: 1 | -1; color: string; health: number }

export type Level = {
  name: string
  subtitle: string
  map: string[]
  guards: Omit<Patrol, 'pathIndex' | 'health'>[]
  dogs: Omit<Patrol, 'pathIndex' | 'health'>[]
  cameras: Camera[]
  reward: string
  roadRows: number[]
  roadCols: number[]
}

export type GameState = {
  player: Point
  guards: Patrol[]
  dogs: Patrol[]
  evidence: Point[]
  coins: Point[]
  weapons: Point[]
  score: number
  lives: number
  alert: 0 | 1
  turn: number
  status: 'playing' | 'won' | 'failed'
  message: string
  health: number
  ammo: number
  scanTick: number
  shot: { from: Point; to: Point; kind: 'player' | 'guard'; id: number } | null
  chasingGuardIndex: number | null
  cars: Car[]
  isJumping: boolean
  lastCarHit: number
  bombs: Point[]
  stamina: number
}
