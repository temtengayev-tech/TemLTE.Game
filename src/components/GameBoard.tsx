import { canWalk, inSight, samePoint, step } from '../game/engine'
import type { Direction, GameState, Level, Point } from '../game/types'

const CELL = 52
const angle: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 }

function beamEnd(origin: Point, direction: Direction, range: number, level: Level) {
  let target = origin
  for (let index = 0; index < range; index += 1) {
    const next = step(target, direction)
    if (!canWalk(level, next)) break
    target = next
  }
  return target
}

function Beam({ from, to, danger = false }: { from: Point; to: Point; danger?: boolean }) {
  return <line className="scan-beam" x1={from.x * CELL + 26} y1={from.y * CELL + 26} x2={to.x * CELL + 26} y2={to.y * CELL + 26}
    stroke={danger ? '#ff4967' : '#ffd34e'} strokeWidth="34" opacity=".14" strokeLinecap="round" />
}

function VisionCone({ guard }: { guard: GameState['guards'][number] }) {
  const radius = CELL * 2.8
  const edge = radius / Math.sqrt(2)
  const offset = { up: [26, 16], right: [37, 26], down: [26, 37], left: [15, 26] }[guard.direction]
  return <g className="vision-unit" style={{ transform: `translate(${guard.x * CELL + offset[0]}px, ${guard.y * CELL + offset[1]}px)` }}>
    <circle className="vision-origin" r="4" />
    <g className="vision-direction" style={{ transform: `rotate(${angle[guard.direction]}deg)` }}><path className="vision-cone" d={`M0 0 L${edge} ${-edge} A${radius} ${radius} 0 0 1 ${edge} ${edge} Z`} /></g>
  </g>
}

function BuildingTile({ x, y }: Point) {
  const px = x * CELL
  const py = y * CELL
  const type = (x + y * 2) % 4
  const colors = ['#9d765f', '#7fa89b', '#c59b57', '#8b929a']
  const labels = ['HOME', 'CLINIC', 'SHOP', 'GUARD']
  const icons = ['⌂', '+', '●', '■']
  return <g className="city-place">
    <rect x={px + 2} y={py + 2} width="48" height="48" rx="7" fill="#e9e4da" stroke="#cdc5b8" strokeWidth="2" />
    <path d={`M${px + 7} ${py + 15}h38v25H${px + 7}z`} fill={colors[type]} opacity=".72" />
    <path d={`M${px + 9} ${py + 13}h34l-6-7H15z`} fill={colors[type]} />
    <text x={px + 26} y={py + 32} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">{icons[type]}</text>
    <text x={px + 26} y={py + 46} textAnchor="middle" fill="#514b45" fontSize="5.5" fontWeight="800">{labels[type]}</text>
  </g>
}

export function GameBoard({ level, state }: { level: Level; state: GameState }) {
  const width = level.map[0].length * CELL
  const height = level.map.length * CELL
  return <div className="board-wrap"><svg className="game-board" viewBox={`0 0 ${width} ${height}`} aria-label="Heist map">
    <defs><pattern id="tiles" width="104" height="104" patternUnits="userSpaceOnUse"><rect width="104" height="104" fill="#121d2b" /><path d="M0 52h104M52 0v104" stroke="#1d2a3b" /></pattern></defs>
    <rect width={width} height={height} fill="#879197" />
    {level.map.map((row, y) => [...row].map((tile, x) => tile !== '#' && (level.roadRows.includes(y) || level.roadCols.includes(x)) ? <g key={`road-${x}-${y}`}>
      <rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill="#292e34" />
      <path d={`M${x * CELL} ${y * CELL + 3}h${CELL}M${x * CELL} ${y * CELL + CELL - 3}h${CELL}`} stroke="#555d63" strokeWidth="3" />
      {x % 2 === 0 && <path d={`M${x * CELL + 14} ${y * CELL + 26}h24`} stroke="#f1c84c" strokeWidth="3" strokeDasharray="9 7" />}
    </g> : tile !== '#' ? <g key={`walk-${x}-${y}`} className="pavement-tile"><rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill="#7f8c91" /><path d={`M${x * CELL} ${y * CELL}h${CELL}v${CELL}h-${CELL}zM${x * CELL + 26} ${y * CELL}v${CELL}M${x * CELL} ${y * CELL + 26}h${CELL}`} stroke="#9ca8ac" strokeWidth="1" /><path d={`M${x * CELL} ${y * CELL + 48}h${CELL}`} stroke="#c3cbcd" strokeWidth="4" /></g> : null))}
    {level.roadRows.map(y => <g key={`crossing-${y}`} opacity=".75">{[0, 1, 2, 3].map(index => <rect key={index} x={CELL * 2 + index * 11} y={y * CELL + 5} width="6" height="42" fill="#e8e9e5" />)}</g>)}
    {state.guards.map((guard, index) => <VisionCone key={`cone-${index}`} guard={guard} />)}
    {level.cameras.map((camera, index) => <Beam key={`cb-${index}`} from={camera} to={beamEnd(camera, camera.direction, camera.range, level)} danger />)}
    {level.map.map((row, y) => [...row].map((tile, x) => {
      const px = x * CELL; const py = y * CELL; const key = `${x}-${y}`
      if (tile === '#') return <BuildingTile key={key} x={x} y={y} />
      if (tile === 'H') return <g key={key}><rect x={px + 10} y={py + 7} width="32" height="40" rx="5" fill="#55647a" /><path d={`M${px + 26} ${py + 9}v36`} stroke="#8694a8" /><circle cx={px + 30} cy={py + 28} r="2" fill="#d3d9e3" /></g>
      if (tile === 'X') return <g key={key}><rect x={px + 5} y={py + 13} width="42" height="29" rx="7" fill={state.evidence.length ? '#667386' : '#4ef0c2'} /><circle cx={px + 15} cy={py + 43} r="5" fill="#101722" /><circle cx={px + 39} cy={py + 43} r="5" fill="#101722" /><text x={px + 26} y={py + 33} textAnchor="middle">🚐</text></g>
      return null
    }))}
    {state.evidence.map(item => <g key={`d-${item.x}-${item.y}`} className="floating"><rect x={item.x * CELL + 13} y={item.y * CELL + 10} width="27" height="34" rx="4" fill="#5da9ff" /><path d={`M${item.x * CELL + 19} ${item.y * CELL + 20}h15M${item.x * CELL + 19} ${item.y * CELL + 27}h15`} stroke="#ddecff" strokeWidth="2" /></g>)}
    {state.coins.map(item => <g key={`c-${item.x}-${item.y}`} className="floating"><circle cx={item.x * CELL + 26} cy={item.y * CELL + 26} r="11" fill="#ffd34e" /><text x={item.x * CELL + 26} y={item.y * CELL + 31} textAnchor="middle" fill="#725300" fontWeight="900">$</text></g>)}
    {state.weapons.map(item => <g key={`w-${item.x}-${item.y}`} className="floating"><circle cx={item.x * CELL + 26} cy={item.y * CELL + 26} r="17" fill="#ff8a4e" opacity=".25" /><text x={item.x * CELL + 26} y={item.y * CELL + 32} textAnchor="middle" fontSize="20">🔫</text></g>)}
    {state.bombs.map((bomb, index) => <g key={`bomb-${bomb.x}-${bomb.y}-${index}`} className="map-bomb"><circle cx={bomb.x * CELL + 26} cy={bomb.y * CELL + 29} r="10" fill="#171b21" stroke="#ff594d" strokeWidth="2" /><circle cx={bomb.x * CELL + 26} cy={bomb.y * CELL + 29} r="3" fill="#ff594d" /><path d={`M${bomb.x * CELL + 29} ${bomb.y * CELL + 19}q8-7 10 1`} fill="none" stroke="#ffca4b" strokeWidth="2" /></g>)}
    {state.cars.map((car, index) => <g key={`car-${index}`} className="traffic-car" transform={`translate(${car.x * CELL + 2} ${car.y * CELL + 6}) rotate(${car.direction < 0 ? 180 : 0} 24 20)`}>
      <rect x="5" y="3" width="38" height="36" rx="13" fill={car.color} stroke="#111820" strokeWidth="2" />
      <path d="M9 13Q24 4 39 13l-3 18Q24 38 12 31z" fill={car.color} stroke="#ffffff33" />
      <path d="M13 14l6-7h11l6 7-3 6H16z" fill="#8eb3c9" stroke="#d9edf5" opacity=".9" />
      <path d="M15 28h18l3 6H12z" fill="#527082" stroke="#a7c2cf" />
      <path d="M10 21h28" stroke="#ffffff55" /><path d="M24 8v27" stroke="#ffffff22" />
      <rect x="1" y="10" width="5" height="9" rx="2" fill="#0c1117" /><rect x="42" y="10" width="5" height="9" rx="2" fill="#0c1117" /><rect x="1" y="25" width="5" height="9" rx="2" fill="#0c1117" /><rect x="42" y="25" width="5" height="9" rx="2" fill="#0c1117" />
      <path d="M6 8h7M35 8h7" stroke="#fff4a8" strokeWidth="3" /><path d="M7 35h6M35 35h6" stroke="#ff4d55" strokeWidth="3" />
      <path d="M5 18L0 15v6zM43 18l5-3v6z" fill={car.color} stroke="#111820" />
      <rect x="7" y="-2" width="36" height="3" rx="1" fill="#26323a" /><rect x="7" y="-2" width={36 * car.health / 100} height="3" rx="1" fill="#4ef0c2" />
    </g>)}
    {level.cameras.map((camera, index) => <g key={`cam-${index}`} transform={`translate(${camera.x * CELL + 26} ${camera.y * CELL + 26}) rotate(${angle[camera.direction]})`}><circle r="14" fill="#ff4967" /><path d="M-5-5L8 0-5 5z" fill="white" /></g>)}
    {state.dogs.map((dog, index) => <g key={`dog-${index}`} className="dog-unit moving-unit" style={{ transform: `translate(${dog.x * CELL}px, ${dog.y * CELL}px)` }}><image href="/assets/dog.png" x="10" y="6" width="32" height="40" /></g>)}
    {state.guards.map((guard, index) => { const firing = state.shot?.kind === 'guard' && samePoint(state.shot.from, guard); return <g className={firing ? 'guard-unit moving-unit firing' : 'guard-unit moving-unit'} style={{ transform: `translate(${guard.x * CELL}px, ${guard.y * CELL}px)` }} key={`guard-${index}-${firing ? state.shot?.id : 'idle'}`}><rect x="7" y="2" width="38" height="5" rx="2" fill="#4b1e28" /><rect x="7" y="2" width={38 * guard.health / 100} height="5" rx="2" fill="#ff586f" /><image href="/assets/guard.png" x="9" y="6" width="34" height="41" /></g> })}
    <g className="player-unit moving-unit" style={{ transform: `translate(${state.player.x * CELL}px, ${state.player.y * CELL}px)` }}><g className={state.isJumping ? 'player-body jumping' : 'player-body'}><rect x="7" y="-3" width="38" height="5" rx="2" fill="#d7d3cc" /><rect x="7" y="-3" width={38 * state.health / 100} height="5" rx="2" fill="#62a886" /><image key={state.shot?.kind === 'player' ? state.shot.id : 'player'} className={state.shot?.kind === 'player' ? 'person-sprite player firing' : 'person-sprite player'} href="/assets/agent.png" x="8" y="3" width="36" height="46" /></g></g>
    {state.shot && <g key={state.shot.id} className={`bullet-shot ${state.shot.kind}`}><circle className="muzzle" cx={state.shot.from.x * CELL + 26} cy={state.shot.from.y * CELL + 26} r="4" /><line x1={state.shot.from.x * CELL + 26} y1={state.shot.from.y * CELL + 26} x2={state.shot.to.x * CELL + 26} y2={state.shot.to.y * CELL + 26} /><circle className="impact-ring" cx={state.shot.to.x * CELL + 26} cy={state.shot.to.y * CELL + 26} r="13" /></g>}
    {state.alert === 1 && <g className="target-lock moving-unit" style={{ transform: `translate(${state.player.x * CELL + 26}px, ${state.player.y * CELL + 26}px)` }}><circle r="23" /><path d="M-29 0h16m26 0h16M0-29v16m0 26v16" /><text y="-19" textAnchor="middle">LOCK</text></g>}
    {state.guards.some(guard => samePoint(guard, state.player) || inSight(guard, guard.direction, state.player, 3, level)) && state.alert === 1 ? null : null}
  </svg></div>
}
