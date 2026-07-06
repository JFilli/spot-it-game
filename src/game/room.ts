import type { GameRoom, LobbyPlayer } from './types'
import { MAX_PLAYERS, TOTAL_ROUNDS } from './types'

export function createLobbyPlayer(name: string): LobbyPlayer {
  return {
    id: crypto.randomUUID(),
    name,
    times: null,
    done: false,
    quit: false,
  }
}

export function totalTime(times: number[] | null): number | null {
  if (!times || times.length === 0) return null
  return times.reduce((sum, t) => sum + t, 0)
}

export function findPlayer(room: GameRoom, playerId: string): LobbyPlayer | undefined {
  return room.players.find((p) => p.id === playerId)
}

export function findPlayerByName(room: GameRoom, name: string): LobbyPlayer | undefined {
  return room.players.find((p) => p.name === name)
}

export function isRoomFull(room: GameRoom): boolean {
  return room.players.length >= MAX_PLAYERS
}

export function finishedPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players
    .filter((p) => p.done && !p.quit && p.times && p.times.length >= TOTAL_ROUNDS)
    .sort((a, b) => (totalTime(a.times) ?? Infinity) - (totalTime(b.times) ?? Infinity))
    .slice(0, MAX_PLAYERS)
}

export function quitPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players.filter((p) => p.quit)
}

export function hasCompletedGame(player: LobbyPlayer): boolean {
  return Boolean(player.done && !player.quit && player.times && player.times.length >= TOTAL_ROUNDS)
}

export function playingPlayers(room: GameRoom): LobbyPlayer[] {
  return room.players.filter((p) => !p.done)
}

export function allPlayersDone(room: GameRoom): boolean {
  return room.players.length > 0 && room.players.every((p) => p.done)
}

export function getLeader(room: GameRoom): LobbyPlayer | null {
  const ranked = finishedPlayers(room)
  return ranked[0] ?? null
}

export function getPlayerRank(room: GameRoom, playerId: string): number | null {
  const ranked = finishedPlayers(room)
  const index = ranked.findIndex((p) => p.id === playerId)
  return index >= 0 ? index + 1 : null
}

/** Migrate legacy two-player room format from localStorage */
export function normalizeRoom(raw: Record<string, unknown>): GameRoom | null {
  if (Array.isArray(raw.players)) {
    const players = (raw.players as LobbyPlayer[]).map((p) => ({
      ...p,
      quit: p.quit ?? false,
    }))
    return { ...(raw as unknown as GameRoom), players }
  }

  const code = raw.code as string
  const seed = raw.seed as string
  if (!code || !seed) return null

  const players: LobbyPlayer[] = []

  if (raw.player1_name) {
    players.push({
      id: crypto.randomUUID(),
      name: raw.player1_name as string,
      times: (raw.player1_times as number[] | null) ?? null,
      done: Boolean(raw.player1_done),
    })
  }

  if (raw.player2_name) {
    players.push({
      id: crypto.randomUUID(),
      name: raw.player2_name as string,
      times: (raw.player2_times as number[] | null) ?? null,
      done: Boolean(raw.player2_done),
    })
  }

  return { code, seed, players }
}
