import type { Direction } from '../game/types'

type Props = { onMove: (direction: Direction) => void; onShoot: () => void; onJump: () => void; onBomb: () => void }

export function Controls({ onMove, onShoot, onJump, onBomb }: Props) {
  return <div className="controls" aria-label="Movement controls">
    <button onClick={() => onMove('up')}>▲</button>
    <div><button onClick={() => onMove('left')}>◀</button><button onClick={() => onMove('down')}>▼</button><button onClick={() => onMove('right')}>▶</button></div>
    <button className="shoot-control" onClick={onShoot}>⌖ SHOOT</button>
    <button className="jump-control" onClick={onJump}>↑ JUMP</button>
    <button className="bomb-control" onClick={onBomb}>● BOMB</button>
  </div>
}
