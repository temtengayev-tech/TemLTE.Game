export type FightSound = 'punch' | 'kick' | 'slide' | 'roundhouse' | 'knockdown' | 'knockout'

const soundFiles: Record<FightSound, string> = {
  punch: '/assets/sounds/punch.mp3',
  kick: '/assets/sounds/kick.mp3',
  slide: '/assets/sounds/heavy-impact.mp3',
  roundhouse: '/assets/sounds/spin.mp3',
  knockdown: '/assets/sounds/fall.mp3',
  knockout: '/assets/sounds/knockout.mp3',
}

export function playFightSound(sound: FightSound, volume = .65) {
  const audio = new Audio(soundFiles[sound])
  audio.volume = volume
  void audio.play().catch(() => undefined)

  if (sound === 'roundhouse') {
    window.setTimeout(() => playFightSound('slide', volume * .9), 320)
  }
}
