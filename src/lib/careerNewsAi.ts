import { supabase } from './supabase'
import { fighters, type FighterId } from '../game/fighters'

type FightResult = { event: number; winner: FighterId; loser: FighterId; detail: string; upset: boolean; titleChange: boolean }
export type AiNewsStory = { category: string; headline: string; body: string }
export type AiCareerNews = { stories: AiNewsStory[]; poll?: { first: FighterId; second: FighterId; firstPercent: number }; source?: 'gemini' | 'local' }

function parseJson(text: string): AiCareerNews {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  const parsed = JSON.parse(cleaned) as AiCareerNews
  if (!Array.isArray(parsed.stories)) throw new Error('Gemini returned an invalid news format')
  if (parsed.poll && (!(parsed.poll.first in fighters) || !(parsed.poll.second in fighters))) delete parsed.poll
  if (parsed.poll) parsed.poll.firstPercent = Math.max(10, Math.min(90, Math.round(parsed.poll.firstPercent)))
  return parsed
}

export async function generateCareerNews(input: { results: FightResult[]; standings: Array<[FighterId, number]>; championId: FighterId; fighterId: FighterId; opponentId: FighterId | null; event: number }) {
  const recent = input.results.slice(-8).map(result => ({ event: result.event, winner: fighters[result.winner].name, loser: fighters[result.loser].name, finish: result.detail, upset: result.upset, titleChange: result.titleChange }))
  const standings = input.standings.map(([id, points], index) => ({ rank: index + 1, id, fighter: fighters[id].name, points, champion: id === input.championId }))
  const { data, error } = await supabase.functions.invoke('ai', { body: {
    system: 'You are the fictional FCB Fight Wire editor inside the Fightron video game. Write energetic but concise MMA journalism. Never claim these fictional stories are real-world facts. Invent rumors only when labeled UNCONFIRMED RUMOR. Return JSON only, without markdown.',
    prompt: JSON.stringify({ task: 'Create 4 fresh career news stories and one public prediction poll from the supplied game state.', editionId: `${input.event}-${input.results.length}-${Date.now()}`, rules: ['Use recent results and ranking points.', 'Never repeat a headline within this edition.', 'Include title changes or upsets when present.', 'One story may be a clearly labeled unconfirmed rumor.', 'Each body must be 20-45 words.', 'Poll percentages must total 100 and favor ranking points while allowing uncertainty.', 'Use fighter IDs in poll first and second.'], output: { stories: [{ category: 'string', headline: 'string', body: 'string' }], poll: { first: 'fighter id', second: 'fighter id', firstPercent: 50 } }, gameState: { event: input.event, champion: fighters[input.championId].name, player: fighters[input.fighterId].name, upcomingOpponent: input.opponentId ? fighters[input.opponentId].name : null, standings, recent } }),
  } })
  if (error) throw new Error(error.message)
  return { ...parseJson(String(data?.text ?? '')), source: 'gemini' as const }
}
