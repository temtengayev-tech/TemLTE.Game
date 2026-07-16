import { useEffect, useState } from 'react'

export function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const started = performance.now()
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.round((performance.now() - started) / 22))
      setProgress(next)
      if (next === 100) {
        window.clearInterval(timer)
        window.setTimeout(onComplete, 350)
      }
    }, 35)
    return () => window.clearInterval(timer)
  }, [onComplete])

  return <main className="boot-screen">
    <div className="boot-grid" />
    <section>
      <div className="boot-mark"><i /><i /></div>
      <small>WORLD FIGHTING CHAMPIONSHIP</small>
      <h1>FIGHTRON</h1>
      <p>WELCOME TO FIGHT NIGHT</p>
      <div className="boot-track"><i style={{ width: `${progress}%` }} /></div>
      <b>{String(progress).padStart(3, '0')}%</b>
    </section>
    <button onClick={onComplete}>SKIP INTRO</button>
  </main>
}
