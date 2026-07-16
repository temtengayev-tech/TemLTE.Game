import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Auth } from './components/Auth'
import { BootScreen } from './components/BootScreen'
import { CareerMode } from './components/CareerMode'
import { FightronGame } from './components/FightronGame'
import { GameMenu } from './components/GameMenu'
import { SoloRing } from './components/SoloRing'
import type { GameSetup } from './game/fighters'
import { supabase } from './lib/supabase'

export default function App() {
  const [game, setGame] = useState<GameSetup | null>(null)
  const [booted, setBooted] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <main className="app-shell">
      <div className="landscape-viewport">{!booted ? (
        <BootScreen onComplete={() => setBooted(true)} />
      ) : showAuth ? (
        <Auth initialMode="signup" onBack={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      ) : game === null ? (
        <GameMenu
          onPlay={(mode, player, opponent) => setGame({ mode, player, opponent })}
          onRegister={() => setShowAuth(true)}
          onSignOut={() => supabase.auth.signOut()}
          userEmail={session?.user.email ?? null}
        />
      ) : game.mode === 'solo' ? (
        <SoloRing fighterId={game.player} onExit={() => setGame(null)} />
      ) : game.mode === 'career' ? (
        <CareerMode fighterId={game.player} onExit={() => setGame(null)} />
      ) : (
        <FightronGame setup={game} onExit={() => setGame(null)} />
      )}</div>
    </main>
  )
}
