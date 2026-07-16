type Props = { health: number; stamina: number; ammo: number; score: number }

export function EquipmentPanel({ health, stamina, ammo, score }: Props) {
  return <aside className="equipment-panel panel-shell">
    <span className="panel-label">AGENT STATUS</span>
    <div className="agent-card"><img src="/assets/agent.png" alt="Agent" /><div><b>FIELD AGENT</b><small>Night Crew</small></div></div>
    <div className="equipment-stat"><span>HEALTH</span><b>{health}/100</b><progress max="100" value={health} /></div>
    <div className="equipment-stat stamina-stat"><span>STAMINA</span><b>{stamina}/100</b><progress max="100" value={stamina} /></div>
    <div className="gear-grid"><div><small>AMMO</small><b>⌖ {ammo}</b></div><div><small>SCORE</small><b>◉ {score}</b></div></div>
    <div className="quick-controls"><small>QUICK CONTROLS</small><p><kbd>← ↑ ↓ →</kbd> Move</p><p><kbd>SHIFT + ↑</kbd> Sprint</p><p><kbd>SPACE</kbd> Jump</p><p><kbd>E / F</kbd> Shoot / Bomb</p></div>
    <div className="danger-note">Red beam = enemy fire line</div>
  </aside>
}
