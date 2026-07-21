import { useEffect, useState } from 'react'
import { fighters, type FighterId } from '../game/fighters'
import { createCareerSave, deleteCareerSave, loadCareerSaves, type CareerSave } from '../lib/careerSaves'
import { CareerMode } from './CareerMode'

export function CareerSlots({ fighterId, onExit }: { fighterId: FighterId; onExit: () => void }) {
  const [saves, setSaves] = useState<CareerSave[]>([])
  const [active, setActive] = useState<CareerSave | null>(null)
  const [status, setStatus] = useState('Loading career slots…')
  const refresh = async () => { try { setSaves(await loadCareerSaves()); setStatus('Saved on this device · Cloud syncs when available') } catch { setStatus('Device saves are temporarily unavailable.') } }
  useEffect(() => { void refresh() }, [])
  if (active) return <CareerMode fighterId={active.fighter_id} save={active} onExit={() => { setActive(null); void refresh() }} />

  return <main className="career-slots"><header><button onClick={onExit}>← MODES</button><div><small>FIGHTRON FC</small><h1>CAREER SAVES</h1></div><b>5 SLOTS</b></header><p>{status || 'Choose a saved career or start a new journey.'}</p><section>{Array.from({ length: 5 }, (_, index) => { const slot = index + 1; const save = saves.find(item => item.slot_number === slot); return <article key={slot} className={save ? 'filled' : ''}><small>SLOT {slot.toString().padStart(2, '0')}</small>{save ? <><i className={`frame-sprite ${fighters[save.fighter_id].sheet} action-idle`} /><h2>{fighters[save.fighter_id].name}</h2><span>EVENT {Number(save.state.event ?? 1)} · {new Date(save.updated_at).toLocaleDateString()}</span><button onClick={() => setActive(save)}>CONTINUE →</button><button className="delete" onClick={async () => { await deleteCareerSave(save.id); await refresh() }}>DELETE</button></> : <><div className="empty-slot">＋</div><h2>NEW CAREER</h2><span>START AS {fighters[fighterId].name}</span><button onClick={async () => { try { const created = await createCareerSave(slot, fighterId); setActive(created) } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not create save.') } }}>CREATE SLOT →</button></>}</article> })}</section></main>
}
