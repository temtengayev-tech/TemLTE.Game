import { LEVELS } from '../game/levels'

type Props = {
  onRegister: () => void
  onStart: (level: number) => void
}

export function StartScreen({ onRegister, onStart }: Props) {
  return <section className="entry-page">
    <nav className="account-nav" aria-label="Account">
      <span>Save your progress</span>
      <button onClick={onRegister}>CREATE ACCOUNT</button>
    </nav>
    <header className="entry-hero city-menu-hero">
      <div className="hero-copy"><span className="eyebrow">OPEN-CITY STEALTH ACTION</span><h1>NIGHT <em>CITY</em></h1><p>Move through living streets, avoid traffic, escape guard patrols, and recover every secret file.</p><div className="menu-pills"><span>3 DISTRICTS</span><span>LIVE TRAFFIC</span><span>STEALTH + ACTION</span></div></div>
      <div className="menu-city-grid" aria-hidden="true"><span>APT</span><span>MED</span><span>SHOP</span><span>SEC</span><img src="/assets/agent.png" /></div>
    </header>
    <section className="level-select"><div className="section-title"><small>MISSION BOARD</small><h2>Choose your heist</h2></div>
      <div className="level-grid">{LEVELS.map((level, index) => <article className="level-card" key={level.name}>
        <span>0{index + 1}</span><small>{index === 0 ? 'EASY' : index === 1 ? 'MEDIUM' : 'HARD'}</small><h3>{level.name}</h3><p>{level.subtitle}</p>
        <div>Reward: <b>{level.reward}</b></div><button onClick={() => onStart(index)}>START HEIST →</button>
      </article>)}</div>
    </section>
    <section className="controls-guide"><div className="section-title"><small>HOW TO PLAY</small><h2>Controls</h2></div>
      <div className="control-cards"><div><span className="key-cluster">← ↑ ↓ →</span><b>MOVE</b><p>Use the arrow keys to move through the city.</p></div><div><span className="space-key">SPACE</span><b>JUMP</b><p>Jump over moving cars and avoid damage.</p></div><div><span className="space-key">E / F</span><b>FIGHT BACK</b><p>E shoots and F plants a 20-damage bomb.</p></div></div>
    </section>
  </section>
}
