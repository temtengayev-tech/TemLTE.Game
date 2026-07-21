export type Venue = {
  id: string
  name: string
  city: string
  region: string
  fightTime: string
  weather: string
  temperature: string
  arenaImage: string
}

export const lasVegasVenue: Venue = {
  id: 'las-vegas',
  name: 'FIGHTRON GRAND ARENA',
  city: 'LAS VEGAS',
  region: 'NEVADA, USA',
  fightTime: '10:30 PM',
  weather: 'CLEAR NIGHT',
  temperature: '82°F',
  arenaImage: '/assets/fightron-las-vegas-arena.png',
}
