import { useEffect, useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import { supabase } from '../lib/supabase'
import { VersionOneActor } from './VersionOneActor'

type PressOption = { label: string; text: string; response: string; hype: number }
type PressConference = { question: string; options: PressOption[] }

const fallbackConferences: PressConference[] = [
  { question: 'What happens when the cage door closes on Friday?', options: [
    { label: 'RESPECTFUL', text: 'I respect the opponent, but I prepared for every position.', response: 'The room appreciates the professional answer.', hype: 3 },
    { label: 'CONFIDENT', text: 'My pressure will decide this fight before the judges can.', response: 'Your opponent laughs and promises to test that confidence.', hype: 8 },
    { label: 'RECKLESS', text: 'This will be the easiest win of my career.', response: 'The crowd boos while your opponent stares you down.', hype: -6 },
  ] },
  { question: 'Your opponent says you have never faced pressure like this. Your response?', options: [
    { label: 'CALM', text: 'Pressure creates openings. I will be ready to use them.', response: 'Analysts praise the composed answer.', hype: 4 },
    { label: 'FIERY', text: 'They will be the one looking for a way out.', response: 'The crowd erupts as both fighters stand up.', hype: 11 },
    { label: 'DISMISSIVE', text: 'I did not even study them.', response: 'Fans question whether you took the camp seriously.', hype: -8 },
  ] },
  { question: 'What would victory mean for your road to the FCB title?', options: [
    { label: 'FOCUSED', text: 'One more step. I am not looking beyond this fight.', response: 'Your coaches nod from the front row.', hype: 5 },
    { label: 'TITLE CALL', text: 'After this win, I want the champion.', response: 'The title-fight callout instantly trends with fans.', hype: 13 },
    { label: 'UNCERTAIN', text: 'I will decide whether I still want to fight afterward.', response: 'The energy drops and reporters begin questioning your motivation.', hype: -10 },
  ] },
]

function parseConference(text: string): PressConference | null {
  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim()) as PressConference
    return json.question && json.options?.length === 3 ? json : null
  } catch { return null }
}

export function CareerMediaDay({ fighter, opponent, event, onComplete }: { fighter: FighterId; opponent: FighterId; event: number; onComplete: (hype: number) => void }) {
  const [conference, setConference] = useState(() => fallbackConferences[(event + fighter.length + opponent.length) % fallbackConferences.length])
  const [choice, setChoice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const create = async () => {
      const prompt = `Create a unique MMA press conference for event ${event}: ${fighters[fighter].name} vs ${fighters[opponent].name}. Return ONLY JSON: {"question":"...","options":[{"label":"...","text":"...","response":"reporter or opponent reaction...","hype":number}]}. Exactly 3 distinct answers. Hype must range from -10 to 15 and at least one answer must lose hype.`
      const { data } = await supabase.functions.invoke('ai', { body: { prompt, system: 'You write realistic, concise FCB MMA career-mode press conferences. No real-world promotion names. Valid JSON only.' } })
      const generated = typeof data?.text === 'string' ? parseConference(data.text) : null
      if (!cancelled) { if (generated) setConference(generated); setLoading(false) }
    }
    void create()
    return () => { cancelled = true }
  }, [event, fighter, opponent])

  const selected = choice === null ? null : conference.options[choice]
  return <section className="fight-week-screen media-day"><header><small>WEDNESDAY · FCB MEDIA DAY · {loading ? 'AI DESK WRITING…' : 'LIVE'}</small><h1>OFFICIAL PRESS CONFERENCE</h1><p>Choose carefully. A bad answer can lose fan hype.</p></header><div className="media-stage"><div className="media-fighter"><VersionOneActor fighter={fighter} action="idle" loop /><b>{fighters[fighter].name}</b></div><article><small>FCB REPORTER</small><h2>“{conference.question}”</h2>{conference.options.map((answer, index) => <button disabled={choice !== null} key={`${answer.label}-${index}`} className={choice === index ? 'selected' : ''} onClick={() => setChoice(index)}><span>{answer.label}</span><p>“{answer.text}”</p><b>{answer.hype > 0 ? '+' : ''}{answer.hype} HYPE</b></button>)}{selected && <div className="press-response"><small>LIVE RESPONSE</small><p>{selected.response}</p></div>}</article><div className="media-fighter"><VersionOneActor fighter={opponent} action="idle" mirrored loop /><b>{fighters[opponent].name}</b></div></div><footer><b>{selected ? `FAN HYPE ${selected.hype >= 0 ? 'INCREASE' : 'DROPS'} ${Math.abs(selected.hype)}` : 'LIVE · FCB FIGHT WIRE'}</b><button disabled={!selected} onClick={() => selected && onComplete(selected.hype)}>LEAVE THE STAGE →</button></footer></section>
}
