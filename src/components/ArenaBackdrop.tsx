import type { Venue } from '../game/venues'

type Props = { isMma: boolean; venue: Venue }

export function ArenaBackdrop({ isMma, venue }: Props) {
  if (!isMma) return <CityBackdrop />

  return <div className="venue-backdrop" style={{ backgroundImage: `url('${venue.arenaImage}')` }}>
    <div className="venue-flare venue-flare-left" aria-hidden="true" />
    <div className="venue-flare venue-flare-right" aria-hidden="true" />
    <div className="venue-light-rig" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
    </div>
    <div className="venue-fcb-banner" aria-hidden="true">
      <small>FCB WORLD CHAMPIONSHIP</small>
      <strong>FIGHTRON</strong>
      <span>PROFESSIONAL MMA</span>
    </div>
    <div className="venue-cage-brand venue-cage-brand-left" aria-hidden="true">FIGHTRON</div>
    <div className="venue-cage-brand venue-cage-brand-right" aria-hidden="true">FCB · MMA</div>
    <div className="venue-canvas-brand" aria-hidden="true">
      <span>MMA</span><strong>FIGHTRON</strong><span>FCB</span>
    </div>
    <aside className="venue-card">
      <small>LIVE FCB VENUE</small>
      <strong>{venue.city}</strong>
      <span>{venue.region}</span>
    </aside>
    <aside className="venue-conditions">
      <span><small>FIGHT TIME</small><b>{venue.fightTime}</b></span>
      <span><small>WEATHER</small><b>{venue.temperature} · {venue.weather}</b></span>
    </aside>
  </div>
}

function CityBackdrop() {
  return <>
    <div className="city-sun" />
    <div className="cloud cloud-one" />
    <div className="cloud cloud-two" />
    <div className="far-skyline">{[1,2,3,4,5,6,7,8].map(i => <i key={i} />)}</div>
    <div className="skyline">{[1,2,3,4,5,6].map(i => <i key={i}><span /><span /><span /><span /></i>)}</div>
    <div className="street-sign">FIGHTRON AVENUE</div>
  </>
}
