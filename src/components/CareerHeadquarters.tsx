import { useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import type { CareerUpgrades } from './FightronGame'

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
  const [panel, setPanel] = useState<'overview' | 'training'>('overview')
  const playerRank = props.standings.findIndex(([id]) => id === props.fighterId)
  const nextOpponent = props.opponent ?? props.choices[0]
  const nextRank = props.standings.findIndex(([id]) => id === nextOpponent)

  return <main className="career-hq">
    <header className="career-hq-header"><b>FIGHTRON <i>FC</i></b><h1>CAREER HEADQUARTERS</h1><div><button onClick={props.onExit}>← MODES</button><span>${props.cash.toLocaleString()}</span></div></header>
    <section className="career-storyline"><b>LIVE SEASON</b><span>EVENT {props.event}</span><p>{props.opponent ? `${fighters[props.fighterId].name} and ${fighters[props.opponent].name} agree to a high-stakes FCB showdown.` : `${fighters[props.fighterId].name} is searching for the next contract.`}</p><div><i style={{ width: `${Math.max(12, 100 - playerRank * 15)}%` }} /><small>ROAD TO THE TITLE</small></div></section>
    <section className="career-hq-grid">
      <aside className="hq-rankings"><header><b>FCB</b><h2>FCB RANKINGS</h2></header><div>{props.standings.map(([id, points], index) => <button key={id} className={`${id === props.fighterId ? 'player' : ''} ${id === props.championId ? 'champion' : ''}`} disabled={id === props.fighterId} onClick={() => props.onRequest(id)}><strong>{index + 1}</strong><i className={`frame-sprite ${fighters[id].sheet} action-idle`} /><span><b>{fighters[id].name}</b><small>{id === props.championId ? 'FCB CHAMPION' : `${points} PTS`}</small></span></button>)}</div><footer>🏆 ROAD TO THE TITLE</footer></aside>
      <div className="hq-fighter"><small>YOUR CONTENDER</small><i className={`frame-sprite ${fighters[props.fighterId].sheet} action-idle`} /><div><h2>{fighters[props.fighterId].name}</h2><span>{props.championId === props.fighterId ? 'FCB WORLD CHAMPION' : `RANK #${playerRank + 1}`}</span><b>EVENT {props.event} · {props.standings[playerRank]?.[1]} PTS</b></div></div>
      <aside className="hq-next-fight"><header><small>NEXT FIGHT</small><h2>{nextOpponent ? fighters[nextOpponent].name : 'OPEN CONTRACT'}</h2></header>{nextOpponent && <><i className={`frame-sprite ${fighters[nextOpponent].sheet} action-idle`} /><strong>RANK #{nextRank + 1} · {fighters[nextOpponent].record}</strong></>}<div><p><span>CONTRACT PURSE</span><b>${props.purse.toLocaleString()}</b></p><p><span>FIGHT FORMAT</span><b>3 ROUNDS</b></p><p><span>EVENT</span><b>FCB {props.event}</b></p><p><span>REWARDS</span><b>RANKING PTS</b></p></div><em>{props.contractMessage}</em></aside>
    </section>
    {panel === 'training' && <section className="hq-training-drawer"><header><div><small>TRAINING CAMP</small><h2>FIGHTER UPGRADES</h2></div><button onClick={() => setPanel('overview')}>CLOSE ×</button></header><div>{(Object.keys(props.upgradeInfo) as UpgradeKey[]).map(key => { const item = props.upgradeInfo[key]; const cost = item.cost * (props.upgrades[key] + 1); return <button key={key} disabled={props.cash < cost || props.upgrades[key] >= 5} onClick={() => props.onBuy(key)}><span>{item.label} · LV {props.upgrades[key]}/5</span><b>{item.gain}</b><strong>{props.upgrades[key] >= 5 ? 'MAXED' : `$${cost.toLocaleString()}`}</strong></button> })}</div></section>}
    <nav className="career-hq-dock"><button onClick={() => setPanel('training')}><i>🏋</i><b>TRAINING</b><span>Improve your skills</span></button><button onClick={() => setPanel('training')}><i>↗</i><b>UPGRADES</b><span>Enhance your fighter</span></button><button><i>▤</i><b>CONTRACTS</b><span>Choose from rankings</span></button><button onClick={props.onNews}><i>▦</i><b>NEWS</b><span>FCB Fight Wire</span></button><button className="rest" onClick={props.onRest}><i>◷</i><b>REST</b><span>Skip this event</span></button><button className="start" disabled={!props.opponent} onClick={props.onFight}><i>拳</i><b>START FIGHT WEEK</b></button></nav>
  </main>
}
