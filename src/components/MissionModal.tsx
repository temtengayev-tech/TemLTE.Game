type Props = { kind: 'failed' | 'level' | 'finished'; reward?: string; score: number; onAction: () => void }

export function MissionModal({ kind, reward, score, onAction }: Props) {
  const content = {
    failed: ['×', 'MISSION FAILED', 'No lives left. Restart and plan a safer route.', 'NEW GAME'],
    level: ['◆', 'HEIST COMPLETE', `New gear unlocked: ${reward}.`, 'NEXT HEIST'],
    finished: ['★', 'MASTER THIEF', `All three jobs completed with ${score} points!`, 'PLAY AGAIN'],
  }[kind]
  return <div className="modal-backdrop"><section className="mission-modal">
    <span className={`modal-icon ${kind}`}>{content[0]}</span><small>SHADOW CREW</small>
    <h2>{content[1]}</h2><p>{content[2]}</p><div className="reward-score">SCORE: {score}</div>
    <button className="primary-button" onClick={onAction}>{content[3]} →</button>
  </section></div>
}
