import { useEffect, useState } from 'react'
import { fighters, modeFighters, type FighterId, type GameMode } from '../game/fighters'
import { FullscreenButton } from './FullscreenButton'

type Props = { onPlay: (mode: GameMode, player: FighterId, opponent: FighterId) => void; onRegister: () => void; onSignOut: () => unknown; userEmail: string | null }
type Slot = 'player' | 'opponent'

const fighterNicknames: Record<FighterId, string> = {
  agent: 'THE UNKNOWN VARIABLE',
  officer: 'THE ENFORCER',
  john: 'THE PRODIGY',
  conor: 'THE LOUDMOUTH',
  islam: 'THE TECHNICIAN',
  khabibi: 'THE MOUNTAIN KING',
  chalres: 'THE SURVIVOR',
}

const nicknameFor = (fighterId: FighterId) => fighterNicknames[fighterId]

export function GameMenu({ onPlay, onRegister, onSignOut, userEmail }: Props) {
  const [mode, setMode] = useState<GameMode | null>(null)
  const [player, setPlayer] = useState<FighterId>('agent')
  const [opponent, setOpponent] = useState<FighterId>('officer')
  const [slot, setSlot] = useState<Slot>('player')

  const chooseMode = (next: GameMode) => {
    setMode(next); setPlayer('agent'); setOpponent('john'); setSlot('player')
  }
  const choices = mode ? modeFighters(mode) : []
  useEffect(() => {
    if (!mode) return
    const keyboard = (event: KeyboardEvent) => {
      const current = slot === 'player' ? player : opponent; const index = choices.findIndex(item => item.id === current)
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { event.preventDefault(); const direction = event.code === 'ArrowRight' ? 1 : -1; const id = choices[(index + direction + choices.length) % choices.length].id; slot === 'player' ? setPlayer(id) : setOpponent(id) }
      if (event.code === 'Enter') { if (mode === 'solo' || mode === 'career') onPlay(mode, player, opponent); else if (slot === 'player') setSlot('opponent'); else if (player !== opponent) onPlay(mode, player, opponent) }
      if (event.code === 'Escape') setMode(null)
    }
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard)
  }, [choices, mode, onPlay, opponent, player, slot])
  if (!mode) return <ModeScreen onChoose={chooseMode} onRegister={onRegister} onSignOut={onSignOut} userEmail={userEmail} />

  const selectedId = slot === 'player' ? player : opponent
  const selected = fighters[selectedId]
  const chooseFighter = (id: FighterId) => slot === 'player' ? setPlayer(id) : setOpponent(id)
  const opponentLabel = mode === 'versus' ? 'PLAYER 2' : 'OPPONENT'

  if (mode === 'solo' || mode === 'career') return <main className={`roster-screen solo-roster roster-${selected.id}`}>
    <header className="roster-header"><button onClick={() => setMode(null)}>← MODES</button><div><small>{mode === 'career' ? 'CAREER SEASON' : 'OPEN RING'}</small><h1>FIGHTRON</h1></div><b>CHOOSE YOUR FIGHTER</b></header>
    <section className="roster-stage solo-selection"><div className="selected-fighter"><div className="fighter-glow" /><i key={selected.id} className={`selection-hero-sprite frame-sprite ${selected.sheet} action-idle`} /><h2>{selected.name}</h2><p>“{nicknameFor(selected.id)}”</p></div><FighterStats key={selected.id} fighter={selected} /></section>
    <section className="roster-strip">{choices.map(fighter => <button key={fighter.id} className={selectedId === fighter.id ? 'selected' : ''} onClick={() => setPlayer(fighter.id)} onDoubleClick={() => onPlay(mode, fighter.id, opponent)}><i className={`frame-sprite ${fighter.sheet} action-idle`} /><span>{fighter.name}<small>{nicknameFor(fighter.id)}</small></span></button>)}</section>
    <footer className="roster-actions"><p>SELECT A FIGHTER · DOUBLE-CLICK OR PRESS START</p><button onClick={() => onPlay(mode, player, opponent)}>{mode === 'career' ? 'START CAREER →' : 'START FREE PLAY →'}</button></footer>
  </main>

  return <main className={`roster-screen roster-${selected.id}`}>
    <header className="roster-header"><button onClick={() => setMode(null)}>← MODES</button><div><small>{mode.toUpperCase()} BATTLE</small><h1>FIGHTRON</h1></div><b>{slot === 'player' ? 'CHOOSE YOUR FIGHTER' : `CHOOSE ${opponentLabel}`}</b></header>
    <section className="roster-stage">
      <aside className="team-slots"><span>FIGHT CARD</span><button className={slot === 'player' ? 'active' : ''} onClick={() => setSlot('player')}><i className={`mini-fighter frame-sprite ${fighters[player].sheet} action-idle`} /><b>P1</b><small>{fighters[player].name}</small></button><strong>VS</strong><button className={slot === 'opponent' ? 'active' : ''} onClick={() => setSlot('opponent')}><i className={`mini-fighter frame-sprite ${fighters[opponent].sheet} action-idle`} /><b>{mode === 'versus' ? 'P2' : 'CPU'}</b><small>{fighters[opponent].name}</small></button></aside>
      <div className="selected-fighter"><div className="fighter-glow" /><i key={selected.id} className={`selection-hero-sprite frame-sprite ${selected.sheet} action-idle`} /><h2>{selected.name}</h2><p>“{nicknameFor(selected.id)}”</p></div>
      <FighterStats key={selected.id} fighter={selected} />
    </section>
    <section className="roster-strip">{choices.map(fighter => <button key={fighter.id} className={selectedId === fighter.id ? 'selected' : ''} onClick={() => chooseFighter(fighter.id)}><i className={`frame-sprite ${fighter.sheet} action-idle`} /><span>{fighter.name}<small>{nicknameFor(fighter.id)}</small></span></button>)}</section>
    <footer className="roster-actions"><p>← → SELECT · ENTER CONFIRM · ESC BACK</p>{slot === 'player' ? <button onClick={() => setSlot('opponent')}>CONFIRM P1 →</button> : <button disabled={player === opponent} onClick={() => onPlay(mode, player, opponent)}>START FIGHT →</button>}</footer>
  </main>
}

function ModeScreen({ onChoose, onRegister, onSignOut, userEmail }: { onChoose: (mode: GameMode) => void; onRegister: () => void; onSignOut: () => unknown; userEmail: string | null }) {
  const [showFormats, setShowFormats] = useState(false)
  return <main className="fight-entry new-entry">
    <div className="entry-scan" /><div className="menu-cage" />
    <header><b>FIGHTRON <i>FC</i></b><div className="entry-tools"><FullscreenButton /><button onClick={userEmail ? onSignOut : onRegister}>{userEmail ? 'SIGN OUT' : 'CREATE ACCOUNT'}</button></div></header>
    <section><small>FCB WORLD CHAMPIONSHIP · MAIN CARD</small><h1>FIGHTRON</h1><div className="menu-title-belt"><img src="/assets/fcb-menu-belt.png" alt="FCB championship belt" /><span>FIGHTRON CHAMPIONSHIP BELT</span></div><p>Choose your division. Build the fight card. Enter the cage.</p><div className="entry-modes"><button onClick={() => setShowFormats(true)}><i>01</i><b>MMA</b><span>Choose a fight format</span></button><button onClick={() => onChoose('career')}><i>02</i><b>CAREER</b><span>Climb the ranks · Win the title</span></button><button onClick={() => onChoose('versus')}><i>03</i><b>LOCAL VS</b><span>Two fighters · One screen</span></button><button onClick={() => onChoose('solo')}><i>04</i><b>OPEN GYM</b><span>Solo training in the cage</span></button></div></section>
    <aside className="phone-mma-decor" aria-hidden="true"><img src="/assets/fcb-menu-belt.png" alt="" /><div><b>FCB WORLD TITLE</b><span>FIGHT NIGHT · ALMATY</span></div><strong>03 ROUNDS</strong><strong>ONE CHAMPION</strong></aside>
    <div className="entry-fighters"><i className="frame-sprite player-frames action-idle" /><span>VS</span><i className="frame-sprite john-frames action-idle" /></div>
    {showFormats && <div className="mma-format-window"><button className="format-close" onClick={() => setShowFormats(false)}>← BACK</button><small>FIGHTRON MMA</small><h2>CHOOSE YOUR FORMAT</h2><div><button onClick={() => onChoose('shootout')}><b>SHOOTOUT</b><span>5 rounds · 20 seconds</span></button><button onClick={() => onChoose('short')}><b>SHORT MATCH</b><span>3 rounds · 15 seconds</span></button><button onClick={() => onChoose('brawl')}><b>BRAWL</b><span>500 HP · Unlimited time and stamina</span></button><button onClick={() => onChoose('mma')}><b>STANDARD MMA</b><span>3 rounds · 20 seconds</span></button></div></div>}
  </main>
}

function FighterStats({ fighter }: { fighter: typeof fighters[FighterId] }) {
  const special = fighter.special.toUpperCase()
  return <aside className="fighter-stats"><small>TALE OF THE TAPE</small><h3>{fighter.name}</h3><strong className="fighter-nickname">“{nicknameFor(fighter.id)}”</strong><div className="fighter-country"><b>{fighter.flag}</b><span>{fighter.nationality}</span></div><section className="fighter-story"><b>THE STORY</b><p>{fighter.story}</p></section><div className="quick-stats"><div className="stat-row"><span>HEALTH</span><b>{fighter.maxHealth}</b><i><em style={{ width: `${fighter.maxHealth / 4}%` }} /></i></div><div className="stat-row"><span>SPEED</span><b>{fighter.speed}</b><i><em style={{ width: `${fighter.speed / 32 * 100}%` }} /></i></div></div><div className="special-box"><span>FIGHTING STYLE</span><b>{fighter.style}</b></div><div className="profile-traits">{fighter.traits.map(trait => <i key={trait}>{trait}</i>)}</div><div className="signature-move"><span>SIGNATURE</span><strong>{special}</strong></div></aside>
}
