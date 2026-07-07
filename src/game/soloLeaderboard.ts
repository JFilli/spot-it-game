import { getDevicePlayerId } from '../lib/devicePlayerId'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { GridSize } from './types'

export interface SoloLeaderboardEntry {
  id: string
  playerId: string
  playerName: string
  gridSize: GridSize
  totalMs: number
}

const TOP_N = 50

function parseGridSize(raw: unknown): GridSize {
  const size = Number(raw)
  if (size === 2 || size === 3 || size === 4 || size === 5) return size
  return 3
}

function normalizeEntry(raw: Record<string, unknown>): SoloLeaderboardEntry {
  return {
    id: String(raw.id),
    playerId: String(raw.player_id),
    playerName: String(raw.player_name),
    gridSize: parseGridSize(raw.grid_size),
    totalMs: Number(raw.total_ms),
  }
}

export async function fetchSoloLeaderboard(gridSize: GridSize): Promise<SoloLeaderboardEntry[]> {
  if (!isSupabaseConfigured) return []

  const supabase = getSupabase()
  const { data, error } = await supabase!
    .from('solo_leaderboard')
    .select('id, player_id, player_name, grid_size, total_ms')
    .eq('grid_size', gridSize)
    .order('total_ms', { ascending: true })
    .limit(TOP_N)

  if (error) throw error
  return (data ?? []).map((row) => normalizeEntry(row as Record<string, unknown>))
}

async function pruneLeaderboard(gridSize: GridSize): Promise<void> {
  const supabase = getSupabase()
  const { data, error } = await supabase!
    .from('solo_leaderboard')
    .select('id')
    .eq('grid_size', gridSize)
    .order('total_ms', { ascending: true })
    .range(TOP_N, TOP_N + 499)

  if (error) throw error
  if (!data?.length) return

  const ids = data.map((row) => row.id)
  const { error: deleteError } = await supabase!.from('solo_leaderboard').delete().in('id', ids)
  if (deleteError) throw deleteError
}

async function qualifiesForTop50(gridSize: GridSize, totalMs: number): Promise<boolean> {
  const supabase = getSupabase()
  const { data, error } = await supabase!
    .from('solo_leaderboard')
    .select('total_ms')
    .eq('grid_size', gridSize)
    .order('total_ms', { ascending: true })
    .limit(TOP_N)

  if (error) throw error
  if (!data || data.length < TOP_N) return true

  const slowest = data[TOP_N - 1].total_ms
  return totalMs <= slowest
}

export type SubmitSoloLeaderboardResult = 'added' | 'not_top_50' | 'offline' | 'error'

export async function submitSoloLeaderboard(
  gridSize: GridSize,
  totalMs: number,
  playerName: string,
): Promise<SubmitSoloLeaderboardResult> {
  if (!isSupabaseConfigured) return 'offline'

  const trimmedName = playerName.trim()
  if (!trimmedName) return 'error'

  try {
    const qualifies = await qualifiesForTop50(gridSize, totalMs)
    if (!qualifies) return 'not_top_50'

    const supabase = getSupabase()
    const { error: insertError } = await supabase!.from('solo_leaderboard').insert({
      player_id: getDevicePlayerId(),
      player_name: trimmedName,
      grid_size: gridSize,
      total_ms: totalMs,
    })

    if (insertError) throw insertError
    await pruneLeaderboard(gridSize)
    return 'added'
  } catch {
    return 'error'
  }
}
