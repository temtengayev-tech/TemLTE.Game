import { supabase } from './supabase'
import type { FighterId } from '../game/fighters'

export type CareerSave = {
  id: string
  slot_number: number
  fighter_id: FighterId
  state: Record<string, unknown>
  updated_at: string
}

const DEVICE_KEY = 'fightron-career-saves-v1'
const loadDevice = (): CareerSave[] => { try { return JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '[]') as CareerSave[] } catch { return [] } }
const saveDevice = (saves: CareerSave[]) => localStorage.setItem(DEVICE_KEY, JSON.stringify(saves))
const storeOnDevice = (save: CareerSave) => { const saves = loadDevice().filter(item => item.slot_number !== save.slot_number); saveDevice([...saves, save].sort((a, b) => a.slot_number - b.slot_number)); return save }

export async function loadCareerSaves() {
  const { data, error } = await supabase.from('career_saves').select('id, slot_number, fighter_id, state, updated_at').order('slot_number')
  if (error) return loadDevice()
  const cloud = (data ?? []) as CareerSave[]
  const merged = [...cloud]
  loadDevice().forEach(local => { if (!merged.some(save => save.slot_number === local.slot_number)) merged.push(local) })
  return merged.sort((a, b) => a.slot_number - b.slot_number)
}

export async function createCareerSave(slotNumber: number, fighterId: FighterId) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const localSave: CareerSave = { id: `device-${slotNumber}`, slot_number: slotNumber, fighter_id: fighterId, state: {}, updated_at: new Date().toISOString() }
  if (userError || !userData.user) return storeOnDevice(localSave)
  const { data, error } = await supabase.from('career_saves').upsert({ user_id: userData.user.id, slot_number: slotNumber, fighter_id: fighterId, state: {} }, { onConflict: 'user_id,slot_number' }).select('id, slot_number, fighter_id, state, updated_at').single()
  if (error) return storeOnDevice(localSave)
  return storeOnDevice(data as CareerSave)
}

export async function updateCareerSave(id: string, fighterId: FighterId, state: Record<string, unknown>) {
  const deviceSaves = loadDevice(); const existing = deviceSaves.find(save => save.id === id)
  if (existing) storeOnDevice({ ...existing, fighter_id: fighterId, state, updated_at: new Date().toISOString() })
  if (id.startsWith('device-')) return
  const { error } = await supabase.from('career_saves').update({ fighter_id: fighterId, state, updated_at: new Date().toISOString() }).eq('id', id)
  if (error && !existing) throw error
}

export async function deleteCareerSave(id: string) {
  const device = loadDevice(); const target = device.find(save => save.id === id); saveDevice(device.filter(save => save.id !== id))
  if (id.startsWith('device-')) return
  const { error } = await supabase.from('career_saves').delete().eq('id', id)
  if (error && !target) throw error
}
