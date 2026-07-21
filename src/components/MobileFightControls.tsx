import type { PointerEvent as ReactPointerEvent } from 'react'

type Attack = 'special' | 'punch' | 'slide' | 'roundhouse'

type Props = {
  specialLabel: string
  onMoveStart: (direction: 'left' | 'right') => void
  onMoveEnd: () => void
  onJump: () => void
  onAttack: (attack: Attack) => void
}

export function MobileFightControls({ specialLabel, onMoveStart, onMoveEnd, onJump, onAttack }: Props) {
  const hold = (direction: 'left' | 'right') => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    onMoveStart(direction)
  }
  const press = (action: () => void) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    action()
  }

  return <nav className="mobile-fight-controls" aria-label="Touch fight controls">
    <div className="mobile-movement">
      <button aria-label="Move left" onPointerDown={hold('left')} onPointerUp={onMoveEnd} onPointerCancel={onMoveEnd}>◀</button>
      <button aria-label="Jump" onPointerDown={press(onJump)}>↑<small>JUMP</small></button>
      <button aria-label="Move right" onPointerDown={hold('right')} onPointerUp={onMoveEnd} onPointerCancel={onMoveEnd}>▶</button>
    </div>
    <div className="mobile-attacks">
      <button className="mobile-slide" onPointerDown={press(() => onAttack('slide'))}>↘<small>SLIDE</small></button>
      <button className="mobile-special" onPointerDown={press(() => onAttack('special'))}>★<small>{specialLabel}</small></button>
      <button className="mobile-punch" onPointerDown={press(() => onAttack('punch'))}>✦<small>PUNCH</small></button>
      <button className="mobile-roundhouse" onPointerDown={press(() => onAttack('roundhouse'))}>↻<small>ROUND</small></button>
    </div>
  </nav>
}
