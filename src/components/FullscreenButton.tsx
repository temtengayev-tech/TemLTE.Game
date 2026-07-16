import { useEffect, useState } from 'react'

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  return <button className="fullscreen-button" onClick={toggleFullscreen}>{isFullscreen ? 'EXIT FULL SCREEN' : '⛶ FULL SCREEN'}</button>
}
