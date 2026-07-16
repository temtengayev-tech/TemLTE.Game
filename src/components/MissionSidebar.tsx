type Props = { title: string; objective: string; evidence: number; guards: number; reward: string }

export function MissionSidebar({ title, objective, evidence, guards, reward }: Props) {
  return <aside className="mission-sidebar panel-shell">
    <span className="panel-label">ACTIVE HEIST</span><h2>{title}</h2><p>{objective}</p>
    <div className="objective-list">
      <div className={evidence === 0 ? 'complete' : ''}><span>01</span><p><b>COLLECT FILES</b><small>{evidence === 0 ? 'Complete' : `${evidence} remaining`}</small></p></div>
      <div><span>02</span><p><b>AVOID OR FIGHT</b><small>{guards} guards active</small></p></div>
      <div><span>03</span><p><b>EXTRACT</b><small>Reach the van</small></p></div>
    </div>
    <div className="sidebar-reward"><small>MISSION REWARD</small><b>◆ {reward}</b></div>
  </aside>
}
