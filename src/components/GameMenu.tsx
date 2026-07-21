import { useEffect, useState } from 'react'
import { fighters, modeFighters, type FighterId, type GameMode } from '../game/fighters'
import { FullscreenButton } from './FullscreenButton'
import { ArenaBackdrop } from './ArenaBackdrop'
import { lasVegasVenue } from '../game/venues'
import type { Language } from '../lib/language'

type Props = { language: Language; onOpenSettings: () => void; onPlay: (mode: GameMode, player: FighterId, opponent: FighterId) => void; onRegister: () => void; onSignOut: () => unknown; userEmail: string | null }
type Slot = 'player' | 'opponent'

const fighterNicknames: Record<FighterId, string> = {
  agent: 'THE UNKNOWN VARIABLE',
  officer: 'THE ENFORCER',
  john: 'THE PRODIGY',
  conor: 'THE LOUDMOUTH',
  islam: 'THE TECHNICIAN',
  khabibi: 'THE MOUNTAIN KING',
  chalres: 'THE SURVIVOR',
  max: 'THE ENDLESS',
  ilia: 'THE MATADOR',
  daniel: 'THE GRINDER',
}

const nicknameFor = (fighterId: FighterId) => fighterNicknames[fighterId]

export function GameMenu({ language, onOpenSettings, onPlay, onRegister, onSignOut, userEmail }: Props) {
  const [mode, setMode] = useState<GameMode | null>(null)
  const [player, setPlayer] = useState<FighterId>('agent')
  const [opponent, setOpponent] = useState<FighterId>('officer')
  const [slot, setSlot] = useState<Slot>('player')

  const chooseMode = (next: GameMode) => {
    if (next === 'test') { onPlay('test', 'agent', 'john'); return }
    setMode(next); setPlayer('agent'); setOpponent('john'); setSlot('player')
  }
  const choices = mode ? modeFighters(mode) : []
  useEffect(() => {
    if (!mode) return
    const keyboard = (event: KeyboardEvent) => {
      const current = slot === 'player' ? player : opponent; const index = choices.findIndex(item => item.id === current)
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { event.preventDefault(); const direction = event.code === 'ArrowRight' ? 1 : -1; const id = choices[(index + direction + choices.length) % choices.length].id; slot === 'player' ? setPlayer(id) : setOpponent(id) }
      if (event.code === 'Enter') { if (mode === 'solo' || mode === 'career' || mode === 'test') onPlay(mode, player, opponent); else if (slot === 'player') setSlot('opponent'); else if (player !== opponent) onPlay(mode, player, opponent) }
      if (event.code === 'Escape') setMode(null)
    }
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard)
  }, [choices, mode, onPlay, opponent, player, slot])
  if (!mode) return <ModeScreen language={language} onOpenSettings={onOpenSettings} onChoose={chooseMode} onRegister={onRegister} onSignOut={onSignOut} userEmail={userEmail} />

  const selectedId = slot === 'player' ? player : opponent
  const selected = fighters[selectedId]
  const chooseFighter = (id: FighterId) => slot === 'player' ? setPlayer(id) : setOpponent(id)
  const roster = <section className="roster-strip" aria-label="Fighter roster">
    {choices.map((fighter, index) => {
      const isSelected = selectedId === fighter.id
      const isTaken = slot === 'opponent' && player === fighter.id
      return <button
        key={fighter.id}
        className={isSelected ? 'selected' : ''}
        disabled={isTaken}
        aria-pressed={isSelected}
        aria-label={`${fighter.name}, ${nicknameFor(fighter.id)}${isTaken ? ', already selected' : ''}`}
        onClick={() => chooseFighter(fighter.id)}
        onDoubleClick={() => !isTaken && (mode === 'solo' || mode === 'career' || mode === 'test') && onPlay(mode, fighter.id, opponent)}
      >
        <small className="roster-number">{String(index + 1).padStart(2, '0')}</small>
        <i className={`frame-sprite ${fighter.sheet} action-idle`} />
        <span><b>{fighter.name}</b><small>{isTaken ? 'P1 PICK' : fighter.style}</small></span>
      </button>
    })}
  </section>
  const selectionHeader = <header className="selection-topbar">
    <b>FIGHTRON <i>FC</i></b>
    <span>{mode === 'career' ? 'CAREER' : mode === 'versus' ? 'LOCAL VS' : `${mode.toUpperCase()} MMA`} · FIGHTER SELECT</span>
    <div><button onClick={() => setMode(null)}>← MODES</button><FullscreenButton /><button onClick={userEmail ? onSignOut : onRegister}>{userEmail ? 'SIGN OUT' : 'CREATE ACCOUNT'}</button></div>
  </header>

  if (mode === 'solo' || mode === 'test') return <main className={`roster-screen gym-roster roster-${selected.id}`}>
    {selectionHeader}
    <section className="gym-selection">
      <div className="gym-roster-list">{roster}</div>
      <div className="selected-fighter"><div className="fighter-glow" /><FighterHero fighter={selected} /><h2>{selected.name}</h2><p>“{nicknameFor(selected.id)}”</p></div>
      <GymFighterPanel key={selected.id} fighter={selected} />
    </section>
    <footer className="gym-footer"><p>{mode === 'test' ? 'CHECK EVERY FRAME, DIRECTION, AND COMBAT ACTION.' : 'OPEN GYM IS THE PERFECT PLACE TO HONE YOUR SKILLS.'}</p><b>{mode === 'test' ? 'VERSION 1 ANIMATION LAB' : 'TRAIN HARD. FIGHT SMART.'}</b><button onClick={() => onPlay(mode, player, opponent)}>{mode === 'test' ? 'OPEN TEST MODE →' : 'ENTER THE GYM →'}</button></footer>
  </main>

  if (mode !== 'versus') return <main className={`roster-screen mma-concept roster-${player}`}>
    {selectionHeader}
    <div className="mma-selection-tabs"><b className="active">{mode === 'career' ? 'CAREER' : 'MMA'}</b><span>{mode === 'career' ? 'ROAD TO THE FCB TITLE' : mode === 'shootout' ? 'SHOOTOUT · 5 ROUNDS' : mode === 'short' ? 'SHORT MATCH · 3 ROUNDS' : mode === 'brawl' ? 'BRAWL · UNLIMITED' : 'STANDARD · 3 ROUNDS'}</span></div>
    <section className="mma-concept-stage">
      <div className="mma-contender"><small>{slot === 'player' ? 'CHOOSE YOUR CONTENDER' : 'YOUR CONTENDER'}</small><div className="selected-fighter"><div className="fighter-glow" /><FighterHero fighter={fighters[player]} /><h2>{fighters[player].name}</h2><p>{fighters[player].record} · {fighters[player].style}</p></div></div>
      <MmaOpponentPanel fighter={fighters[mode === 'career' ? 'john' : opponent]} isChoosing={mode !== 'career' && slot === 'opponent'} />
    </section>
    {roster}
    <footer className="roster-actions"><p>{mode === 'career' ? 'CHOOSE THE CONTENDER WHO WILL START YOUR CAREER' : slot === 'player' ? 'SELECT YOUR FIGHTER' : 'SELECT THE OPPONENT ON THE FIGHT CARD'}</p>{mode === 'career' ? <button onClick={() => onPlay(mode, player, 'john')}>START CAREER →</button> : slot === 'player' ? <button onClick={() => setSlot('opponent')}>CONFIRM CONTENDER →</button> : <button disabled={player === opponent} onClick={() => onPlay(mode, player, opponent)}>START {mode.toUpperCase()} →</button>}</footer>
  </main>

  return <main className={`roster-screen versus-faceoff roster-${selected.id}`}>
    {selectionHeader}
    <div className="versus-turn"><i>{slot === 'player' ? '01' : '02'}</i><b>{slot === 'player' ? 'PLAYER 1 · CHOOSE' : 'PLAYER 2 · CHOOSE'}</b></div>
    <section className="versus-stage"><button className={slot === 'player' ? 'versus-player active' : 'versus-player'} onClick={() => setSlot('player')}><small>RED CORNER · PLAYER 1</small><FighterHero fighter={fighters[player]} /><h2>{fighters[player].name}</h2><span>{fighters[player].record} · {fighters[player].style}</span></button><div className="versus-card"><small>FCB LOCAL MAIN EVENT</small><strong>VS</strong><p>3 ROUNDS</p><p>20 SECONDS</p><b>ONE SCREEN · TWO PLAYERS</b></div><button className={slot === 'opponent' ? 'versus-player blue active' : 'versus-player blue'} onClick={() => setSlot('opponent')}><small>BLUE CORNER · PLAYER 2</small><FighterHero fighter={fighters[opponent]} /><h2>{fighters[opponent].name}</h2><span>{fighters[opponent].record} · {fighters[opponent].style}</span></button></section>
    {roster}
    <footer className="roster-actions"><p>P1: A/D · W · F/G &nbsp; | &nbsp; P2: J/L · I · O/P</p>{slot === 'player' ? <button onClick={() => setSlot('opponent')}>LOCK RED CORNER →</button> : <button disabled={player === opponent} onClick={() => onPlay(mode, player, opponent)}>START LOCAL FIGHT →</button>}</footer>
  </main>
}

function ModeScreen({ language, onOpenSettings, onChoose, onRegister, onSignOut, userEmail }: { language: Language; onOpenSettings: () => void; onChoose: (mode: GameMode) => void; onRegister: () => void; onSignOut: () => unknown; userEmail: string | null }) {
  const [showFormats, setShowFormats] = useState(false)
  const featured = fighters.islam
  const champion = fighters.john
  const t = language === 'ru' ? {
    championship: 'ЧЕМПИОНАТ МИРА FCB', mma: 'ММА', mmaHelp: 'Форматы боя · Карьера · Мировой титул', career: 'КАРЬЕРА', careerHelp: 'Рейтинг · Контракты · Мировой титул', versus: 'ЛОКАЛЬНЫЙ VS', versusHelp: 'Два бойца · Один экран', gym: 'ТРЕНИРОВКА', gymHelp: 'Одиночная тренировка в октагоне', settings: '⚙ НАСТРОЙКИ', store: 'МАГАЗИН', extras: 'ДОПОЛНИТЕЛЬНО', account: 'АККАУНТ', signOut: 'ВЫЙТИ', create: 'СОЗДАТЬ АККАУНТ', choose: 'ВЫБЕРИТЕ ВЕРСИЮ', back: 'НАЗАД', standard: 'СТАНДАРТНОЕ ММА', short: 'КОРОТКИЙ БОЙ', rounds3: '3 раунда · 20 секунд', rounds5: '5 раундов · 20 секунд', roundsShort: '3 раунда · 15 секунд', brawlHelp: '500 HP · Без лимита времени и выносливости'
  } : {
    championship: 'FCB WORLD CHAMPIONSHIP', mma: 'MMA', mmaHelp: 'Fight formats · Career · World title', career: 'CAREER', careerHelp: 'Rankings · Contracts · World title', versus: 'LOCAL VS', versusHelp: 'Two fighters · One screen', gym: 'OPEN GYM', gymHelp: 'Solo training in the octagon', settings: '⚙ SETTINGS', store: 'STORE', extras: 'EXTRAS', account: 'ACCOUNT', signOut: 'SIGN OUT', create: 'CREATE ACCOUNT', choose: 'CHOOSE YOUR VERSION', back: 'BACK', standard: 'STANDARD MMA', short: 'SHORT MATCH', rounds3: '3 rounds · 20 seconds', rounds5: '5 rounds · 20 seconds', roundsShort: '3 rounds · 15 seconds', brawlHelp: '500 HP · Unlimited time and stamina'
  }
  return <main className="fight-entry new-entry premium-entry">
    <ArenaBackdrop isMma venue={lasVegasVenue} />
    <div className="entry-scan" /><div className="menu-cage" /><div className="menu-arena-lights"><i /><i /><i /><i /><i /></div>
    <header><b>FIGHTRON <i>FC</i></b><div className="entry-tools"><FullscreenButton /><button onClick={userEmail ? onSignOut : onRegister}>{userEmail ? t.signOut : t.create}</button></div></header>
    <section className="entry-navigation"><small>{t.championship}</small><div className="entry-modes"><button onClick={() => setShowFormats(true)}><i><span aria-hidden="true">🥊</span><em>01</em></i><b>{t.mma}</b><span>{t.mmaHelp}</span></button><button onClick={() => onChoose('versus')}><i><span aria-hidden="true">VS</span><em>02</em></i><b>{t.versus}</b><span>{t.versusHelp}</span></button><button onClick={() => onChoose('solo')}><i><span aria-hidden="true">🏋</span><em>03</em></i><b>{t.gym}</b><span>{t.gymHelp}</span></button><button onClick={() => onChoose('test')}><i><span aria-hidden="true">8F</span><em>04</em></i><b>ANIMATION TEST</b><span>All fighters · All combat frames</span></button></div></section>
    <section className="menu-belt-stage"><small>FCB CHAMPION</small><img src="/assets/fcb-menu-belt.png" alt="FCB championship belt" /><b>THE ULTIMATE HONOR</b><span>EARN IT · DEFEND IT · BE LEGEND</span></section>
    <div className="entry-fighters" aria-label={`${featured.name} facing ${champion.name}`}>
      <img className="menu-hero-islam" src="/assets/islam-menu-hero.png" alt="Islam Machete facing right" />
      <span>FACE OFF</span>
      <img className="menu-hero-john" src="/assets/john-menu-hero.png" alt="John Bones facing left" />
    </div>
    <aside className="menu-career-card"><small>ROAD TO THE FCB TITLE</small><div><span>FEATURED CONTENDER</span><strong>{featured.name}</strong></div><div><span>RECORD</span><b>{featured.record}</b></div><div><span>NEXT FIGHT</span><b>{featured.name} <em>VS</em> {champion.name}</b></div><footer>MAIN EVENT · FCB SEASON 01</footer></aside>
    <nav className="menu-utility"><button onClick={onOpenSettings}>{t.settings}</button><button>{t.store}</button><button>{t.extras}</button><button onClick={userEmail ? onSignOut : onRegister}>{userEmail ? t.signOut : t.account}</button></nav>
    {showFormats && <div className="mma-format-window"><button className="format-close" onClick={() => setShowFormats(false)}>← {t.back}</button><small>FIGHTRON MMA</small><h2>{t.choose}</h2><div><button onClick={() => onChoose('career')}><b>{t.career}</b><span>{t.careerHelp}</span></button><button onClick={() => onChoose('mma')}><b>{t.standard}</b><span>{t.rounds3}</span></button><button onClick={() => onChoose('shootout')}><b>SHOOTOUT</b><span>{t.rounds5}</span></button><button onClick={() => onChoose('short')}><b>{t.short}</b><span>{t.roundsShort}</span></button><button onClick={() => onChoose('brawl')}><b>BRAWL</b><span>{t.brawlHelp}</span></button></div></div>}
  </main>
}

function GymFighterPanel({ fighter }: { fighter: typeof fighters[FighterId] }) {
  return <aside className="gym-fighter-panel">
    <header><h2>OPEN GYM</h2><p>TRAIN · IMPROVE · EVOLVE</p></header>
    <section><small>SELECTED FIGHTER</small><h3>{fighter.name}</h3><strong>“{nicknameFor(fighter.id)}”</strong></section>
    <section><small>FIGHTER STYLE</small><h4>{fighter.style}</h4><div className="gym-meter"><span>HEALTH</span><b>{fighter.maxHealth}</b><i><em style={{ width: `${fighter.maxHealth / 4}%` }} /></i></div><div className="gym-meter"><span>SPEED</span><b>{fighter.speed}</b><i><em style={{ width: `${fighter.speed / 32 * 100}%` }} /></i></div></section>
    <section className="gym-signature"><small>SIGNATURE</small><b>{fighter.special.toUpperCase()}</b><div>{fighter.traits.map(trait => <i key={trait}>{trait}</i>)}</div></section>
    <footer><span>← → NAVIGATE</span><span>ENTER SELECT</span><span>ESC BACK</span></footer>
  </aside>
}

function MmaOpponentPanel({ fighter, isChoosing }: { fighter: typeof fighters[FighterId]; isChoosing: boolean }) {
  return <aside className={isChoosing ? 'mma-opponent-panel choosing' : 'mma-opponent-panel'}><small>{isChoosing ? 'CHOOSE OPPONENT' : 'FIGHT CARD'}</small><h3>YOUR OPPONENT</h3><FighterHero fighter={fighter} compact /><span>{fighter.flag} {fighter.nationality}</span><h2>{fighter.name}</h2><strong>{fighter.record}</strong><div><p><span>STYLE</span><b>{fighter.style}</b></p><p><span>HEALTH</span><b>{fighter.maxHealth}</b></p><p><span>SPEED</span><b>{fighter.speed}</b></p></div></aside>
}

function FighterHero({ fighter, compact = false }: { fighter: typeof fighters[FighterId]; compact?: boolean }) {
  return fighter.id === 'khabibi'
    ? <i role="img" aria-label={fighter.name} className={`${compact ? 'opponent-hero-sprite' : 'selection-hero-sprite'} frame-sprite ${fighter.sheet} action-idle`} />
    : <img className={compact ? 'opponent-hero-image' : 'selection-hero-image'} src={`/assets/${fighter.id}-menu-fighter.png`} alt={fighter.name} />
}
