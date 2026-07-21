import type { FighterInfo, GameMode } from '../game/fighters'
import type { Venue } from '../game/venues'

function Competitor({ fighter, corner }: { fighter: FighterInfo; corner: string }) {
  return <article className="prefight-competitor">
    <small>{corner}</small>
    <i className={`frame-sprite ${fighter.sheet} action-idle`} />
    <h2>{fighter.name}</h2>
    <p>“{fighter.nickname}”</p>
  </article>
}

function Comparison({ label, left, right }: { label: string; left: string; right: string }) {
  return <div className="prefight-stat"><b>{left}</b><span>{label}</span><b>{right}</b></div>
}

export function PrefightCard({ player, opponent, mode, venue, onStart }: { player: FighterInfo; opponent: FighterInfo; mode: GameMode; venue: Venue; onStart: () => void }) {
  return <div className="prefight-card" role="dialog" aria-modal="true" aria-label="Tale of the tape">
    <header><small>FIGHTRON MMA · {mode.toUpperCase()}</small><h1>TALE OF THE TAPE</h1>
      <div className="prefight-venue" aria-label="Fight venue details">
        <span><small>LOCATION</small><b>{venue.city}</b><em>{venue.region}</em></span>
        <span><small>FIGHT TIME</small><b>{venue.fightTime}</b><em>LOCAL TIME</em></span>
        <span><small>WEATHER</small><b>{venue.temperature}</b><em>{venue.weather}</em></span>
      </div>
    </header>
    <section className="prefight-matchup">
      <Competitor fighter={player} corner="RED CORNER" />
      <div className="prefight-comparison"><strong>VS</strong>
        <Comparison label="HEIGHT" left={player.height} right={opponent.height} />
        <Comparison label="WEIGHT" left={player.weight} right={opponent.weight} />
        <Comparison label="RECORD" left={player.record} right={opponent.record} />
      </div>
      <Competitor fighter={opponent} corner="BLUE CORNER" />
    </section>
    <button onClick={onStart}>BEGIN THE FIGHT</button>
  </div>
}
