import { useEffect, useState, type CSSProperties } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Auth } from './components/Auth'
import { BootScreen } from './components/BootScreen'
import { CareerSlots } from './components/CareerSlots'
import { FightronGame } from './components/FightronGame'
import { GameMenu } from './components/GameMenu'
import { SettingsPage } from './components/SettingsPage'
import { SoloRing } from './components/SoloRing'
import { AnimationTestMode } from './components/AnimationTestMode'
import type { GameSetup } from './game/fighters'
import { supabase } from './lib/supabase'
import { loadLanguage, saveLanguage, type Language } from './lib/language'

type PhoneCanvasStyle = CSSProperties & {
  '--phone-scale'?: string
  '--phone-canvas-width'?: string
  '--phone-canvas-height'?: string
}

const phoneCanvas = { width: 844, height: 390 }

export default function App() {
  const [game, setGame] = useState<GameSetup | null>(null)
  const [booted, setBooted] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [language, setLanguage] = useState<Language>(loadLanguage)
  const [phoneCanvasStyle, setPhoneCanvasStyle] = useState<PhoneCanvasStyle>({
    '--phone-scale': '1',
    '--phone-canvas-width': `${phoneCanvas.width}px`,
    '--phone-canvas-height': `${phoneCanvas.height}px`,
  })

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    saveLanguage(nextLanguage)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const updatePhoneScale = () => {
      const viewport = window.visualViewport
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const isTouchPhone = window.matchMedia('(hover: none) and (pointer: coarse)').matches && Math.min(width, height) <= 600
      const canvasWidth = height > width ? height : width
      const canvasHeight = height > width ? width : height
      const scale = isTouchPhone ? Math.min(canvasWidth / phoneCanvas.width, canvasHeight / phoneCanvas.height) : 1

      setPhoneCanvasStyle({
        '--phone-scale': String(Number(scale.toFixed(4))),
        '--phone-canvas-width': `${phoneCanvas.width}px`,
        '--phone-canvas-height': `${phoneCanvas.height}px`,
      })
    }

    updatePhoneScale()
    window.addEventListener('resize', updatePhoneScale)
    window.addEventListener('orientationchange', updatePhoneScale)
    window.visualViewport?.addEventListener('resize', updatePhoneScale)
    return () => {
      window.removeEventListener('resize', updatePhoneScale)
      window.removeEventListener('orientationchange', updatePhoneScale)
      window.visualViewport?.removeEventListener('resize', updatePhoneScale)
    }
  }, [])

  return (
    <main className="app-shell">
      <div className="landscape-viewport" style={phoneCanvasStyle}>{!booted ? (
        <BootScreen onComplete={() => setBooted(true)} />
      ) : showAuth ? (
        <Auth initialMode="signup" onBack={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      ) : showSettings ? (
        <SettingsPage language={language} onLanguageChange={changeLanguage} onBack={() => setShowSettings(false)} />
      ) : game === null ? (
        <GameMenu
          language={language}
          onOpenSettings={() => setShowSettings(true)}
          onPlay={(mode, player, opponent) => setGame({ mode, player, opponent })}
          onRegister={() => setShowAuth(true)}
          onSignOut={() => supabase.auth.signOut()}
          userEmail={session?.user.email ?? null}
        />
      ) : game.mode === 'solo' ? (
        <SoloRing fighterId={game.player} onExit={() => setGame(null)} />
      ) : game.mode === 'career' ? (
        <CareerSlots fighterId={game.player} onExit={() => setGame(null)} />
      ) : game.mode === 'test' ? (
        <AnimationTestMode initialFighter={game.player} onExit={() => setGame(null)} />
      ) : (
        <FightronGame setup={game} onExit={() => setGame(null)} />
      )}</div>
    </main>
  )
}
