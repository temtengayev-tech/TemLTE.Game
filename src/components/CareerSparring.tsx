import type { FighterId, GameSetup } from '../game/fighters'
import { FightronGame } from './FightronGame'

export function CareerSparring({ fighter, opponent, onComplete }: { fighter: FighterId; opponent: FighterId; onComplete: () => void }) {
  const setup: GameSetup = { mode: 'career', player: fighter, opponent }
  return <div className="career-real-sparring">
    <div className="sparring-lock-label"><b>LIVE SPARRING</b><span>20 SECONDS · HEALTH LOCKED · NO KNOCKOUT</span></div>
    <FightronGame setup={setup} sparring isTitleFight={false} onExit={onComplete} onSparringComplete={onComplete} />
  </div>
}
