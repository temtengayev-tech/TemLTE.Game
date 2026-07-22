import type { CSSProperties } from 'react'
import type { FighterId } from '../game/fighters'
import { getVersionOneStrip, type VersionOneAction } from '../game/versionOneStrips'

type ActorStyle = CSSProperties & { '--career-frames': number; '--career-steps': number; '--career-duration': string }

export function VersionOneActor({ fighter, action, mirrored = false, loop = false, staticPose = false }: { fighter: FighterId; action: VersionOneAction; mirrored?: boolean; loop?: boolean; staticPose?: boolean }) {
  const strip = getVersionOneStrip(fighter, action) ?? getVersionOneStrip(fighter, 'idle')
  if (!strip) return null
  const freezeFrame = staticPose || action === 'idle'
  const style: ActorStyle = {
    '--career-frames': strip.frames,
    '--career-steps': Math.max(1, strip.frames - 1),
    '--career-duration': `${action === 'idle' ? 1000 : action === 'roundhouse' ? 900 : 650}ms`,
    backgroundImage: `url('${strip.url}')`,
    backgroundSize: `${strip.frames * 100}% 100%`,
  }
  return <i key={`${fighter}-${action}`} className={`career-v1-actor ${mirrored ? 'mirrored' : ''} ${loop && !freezeFrame ? 'loop' : ''} ${freezeFrame ? 'static' : ''}`} style={style} aria-label={`${fighter} ${action} pose`} />
}
