import { useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import { getVersionOneDesignUrl } from '../game/versionOneStrips'
import type { CareerUpgrades } from './FightronGame'
import { VersionOneActor } from './VersionOneActor'
import type { CareerCondition } from '../lib/careerCondition'

type UpgradeKey = keyof CareerUpgrades
type UpgradeInfo = Record<UpgradeKey, { label: string; cost: number; gain: string }>

type Props = {
  fighterId: FighterId
  championId: FighterId
  opponent: FighterId | null
  event: number
  cash: number
  purse: number
  contractMessage: string
  fanHype: number
  condition: CareerCondition
  standings: Array<[FighterId, number]>
  choices: FighterId[]
  upgrades: CareerUpgrades
  upgradeInfo: UpgradeInfo
  onExit: () => void
  onNews: () => void
  onRequest: (id: FighterId) => void
  onBuy: (key: UpgradeKey) => void
  onFight: () => void
  onRest: () => void
}

export function CareerHeadquarters(props: Props) {
  const [panel, setPanel] = useState<'overview' | 'training' | 'rankings' | 'offers'>('overview')
  const playerRank = props.standings.findIndex(([id]) => id === props.fighterId)
  const nextOpponent = props.opponent ?? props.choices[0]

  const roadProgress = Math.max(8, 100 - playerRank * 14)
  return <main className="career-hq career-hq-approved">
    <header className="career-hq-header"><b>FIGHTRON <i>FC</i></b><div><h1>CAREER HQ</h1><small>SEASON {String(props.event).padStart(2, '0')}</small></div><nav><span>▰ ${props.cash.toLocaleString()}</span><button onClick={props.onExit}>← BACK</button></nav></header>
    <section className="career-dashboard">
      <aside className="career-nav"><button className={panel === 'overview' ? 'active' : ''} onClick={() => setPanel('overview')}><i>▥</i>DASHBOARD</button><button onClick={() => setPanel('training')}><i>🏋</i>TRAINING CAMP</button><button onClick={() => setPanel('offers')}><i>◇</i>FIGHT OFFERS</button><button onClick={() => setPanel('rankings')}><i>♛</i>RANKINGS</button><button onClick={props.onNews}><i>▤</i>NEWS</button></aside>
      <section className="career-center-card"><aside className="career-vitals"><p><small>RECORD</small><b>{fighters[props.fighterId].record}</b></p><p><small>RANK</small><b className="red">#{playerRank + 1}</b></p><p><small>CONDITION</small><b>{Math.max(35, 100 - props.condition.fatigue)}%</b></p><p><small>FAN HYPE</small><b>{props.fanHype}%</b></p><p><small>MEDICAL</small><b className={props.condition.injury ? 'red medical-value' : 'green'}>{props.condition.injury?.name ?? 'CLEARED'}</b></p></aside><div className="career-stage"><VersionOneActor fighter={props.fighterId} action="idle" loop /><h2>{fighters[props.fighterId].name}</h2></div><div className="career-title-road"><b>ROAD TO THE TITLE</b><i><em style={{ width: `${roadProgress}%` }} /></i><div><span>PRO DEBUT</span><span>RISING PROSPECT</span><span>TOP 10</span><span>TITLE CONTENDER</span><span>CHAMPION</span></div></div></section>
      <aside className="career-contract"><small>NEXT FIGHT</small><VersionOneActor fighter={nextOpponent} action="idle" mirrored loop /><h2>{fighters[nextOpponent].name}</h2><p><span>RECORD</span><b>{fighters[nextOpponent].record}</b></p><p><span>PURSE</span><b>${props.purse.toLocaleString()}</b></p><p><span>ROUNDS</span><b>3 ROUNDS</b></p><p><span>MATCHUP RISK</span><b className="red">HIGH</b></p><button disabled={!props.opponent} onClick={props.onFight}>拳 START FIGHT WEEK</button></aside>
    </section>
    {panel === 'training' && <section className="hq-training-drawer"><header><div><small>TRAINING CAMP</small><h2>FIGHTER UPGRADES</h2></div><button onClick={() => setPanel('overview')}>CLOSE ×</button></header><div>{(Object.keys(props.upgradeInfo) as UpgradeKey[]).map(key => { const item = props.upgradeInfo[key]; const cost = item.cost * (props.upgrades[key] + 1); return <button key={key} disabled={props.cash < cost || props.upgrades[key] >= 5} onClick={() => props.onBuy(key)}><span>{item.label} · LV {props.upgrades[key]}/5</span><b>{item.gain}</b><strong>{props.upgrades[key] >= 5 ? 'MAXED' : `$${cost.toLocaleString()}`}</strong></button> })}</div></section>}
    {(panel === 'rankings' || panel === 'offers') && <section className="hq-side-drawer"><header><div><small>FCB OFFICIAL</small><h2>{panel === 'rankings' ? 'WORLD RANKINGS' : 'FIGHT OFFERS'}</h2></div><button onClick={() => setPanel('overview')}>CLOSE ×</button></header><div>{props.standings.map(([id, points], index) => { const champion = id === props.championId; return <button className={champion ? 'ranking-champion' : ''} key={id} disabled={id === props.fighterId} onClick={() => { props.onRequest(id); setPanel('overview') }}><strong>{champion && <i aria-label="Champion">♛</i>}#{index + 1}</strong><img src={getVersionOneDesignUrl(id)} alt={fighters[id].name} /><span><b>{fighters[id].name}</b><small>{champion ? 'FCB WORLD CHAMPION' : `${points} PTS · ${fighters[id].record}`}</small></span>{champion && <em>CHAMPION</em>}</button> })}</div></section>}
    <section className="career-week-preview"><h2>FIGHT WEEK</h2><div>{[['MON', '🏋', 'TRAINING'], ['TUE', '♟', 'SPARRING'], ['WED', '♜', 'MEDIA'], ['THU', '▱', 'WEIGH-IN'], ['FRI', '拳', 'FIGHT'], ['SAT', '♥', 'REST'], ['SUN', '☾', 'REST']].map(([day, icon, label], index) => <article key={day} className={index === 4 ? 'fight' : index > 4 ? 'rest' : ''}><small>{day}</small><i>{icon}</i><b>{label}</b></article>)}</div><aside><p>♥ <span>FATIGUE</span><b>{props.condition.fatigue < 25 ? 'LOW' : props.condition.fatigue < 60 ? 'MEDIUM' : 'HIGH'}</b></p><p className={props.condition.injury ? 'injured' : ''}>⬟ <span>INJURY</span><b>{props.condition.injury?.name ?? 'NONE'}</b></p></aside></section>
  </main>
}
