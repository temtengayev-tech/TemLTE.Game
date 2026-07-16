type Props = { level: number; name: string; score: number; health: number; stamina: number; ammo: number; evidence: number; onQuit: () => void }

export function GameHud({ level, name, score, health, stamina, ammo, evidence, onQuit }: Props) {
  return <header className="game-hud">
    <button className="icon-button" onClick={onQuit} aria-label="Back to menu">←</button>
    <div><small>HEIST {level} OF 3</small><strong>{name}</strong></div>
    <div className="hud-stats"><b>▣ {evidence}</b><b>🔫 {ammo}</b><b>♥ {health}</b><b>⚡ {stamina}</b><b>◉ {score}</b></div>
  </header>
}
