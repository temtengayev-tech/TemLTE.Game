import type { Level, Point } from './types'

const street = (from: number, to: number, y: number): Point[] =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }))

const cityGrid = (featureRows: [string, string, string, string]): string[] => [
  '#######################', featureRows[0], '#####.#####.#####.#####', '#.....................#',
  '#####.#####.#####.#####', featureRows[1], '#####.#####.#####.#####', '#.....................#',
  '#####.#####.#####.#####', featureRows[2], '#####.#####.#####.#####', featureRows[3],
  '#######################',
]

const cityRoads = { roadRows: [3, 7, 11], roadCols: [5, 11, 17] }

export const LEVELS: Level[] = [
  {
    name: 'Neon District', subtitle: 'Recover 3 files across the city grid', reward: 'Optic Cloak', ...cityRoads,
    map: cityGrid(['#P.......D..........X.#', '#...D......H..........#', '#..W.......D.......C..#', '#....H....C...........#']),
    guards: [
      { x: 3, y: 3, direction: 'right', path: street(2, 9, 3) },
      { x: 13, y: 7, direction: 'right', path: street(12, 20, 7) },
      { x: 5, y: 11, direction: 'right', path: street(2, 10, 11) },
    ], dogs: [], cameras: [{ x: 17, y: 5, direction: 'down', range: 3 }],
  },
  {
    name: 'Circuit Quarter', subtitle: 'Cross the security district and extract', reward: 'Pulse Scanner', ...cityRoads,
    map: cityGrid(['#P...D..............X.#', '#.......H...D.........#', '#..D....W.........C...#', '#.....C......H........#']),
    guards: [
      { x: 4, y: 3, direction: 'right', path: street(2, 9, 3) },
      { x: 14, y: 3, direction: 'right', path: street(12, 20, 3) },
      { x: 7, y: 7, direction: 'right', path: street(2, 10, 7) },
      { x: 16, y: 7, direction: 'left', path: street(12, 20, 7) },
      { x: 8, y: 11, direction: 'right', path: street(3, 10, 11) },
    ], dogs: [{ x: 18, y: 11, direction: 'left', path: street(13, 20, 11) }], cameras: [],
  },
  {
    name: 'Quantum Core', subtitle: 'Raid the central technology complex', reward: 'City Ghost Badge', ...cityRoads,
    map: cityGrid(['#P....D.............X.#', '#..H......D...........#', '#....W.........D..C...#', '#..C......H...........#']),
    guards: [
      { x: 3, y: 3, direction: 'right', path: street(2, 9, 3) },
      { x: 13, y: 3, direction: 'right', path: street(12, 20, 3) },
      { x: 4, y: 7, direction: 'right', path: street(2, 10, 7) },
      { x: 15, y: 7, direction: 'right', path: street(12, 20, 7) },
      { x: 6, y: 11, direction: 'right', path: street(2, 10, 11) },
      { x: 18, y: 11, direction: 'left', path: street(12, 20, 11) },
    ], dogs: [{ x: 11, y: 5, direction: 'down', path: [{ x: 11, y: 5 }, { x: 11, y: 9 }] }], cameras: [{ x: 17, y: 9, direction: 'up', range: 3 }],
  },
]
